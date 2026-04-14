import { useState, useRef } from 'react';
import Image from 'next/image';
import { formatPrice } from '@/lib/constants';
import { Button } from '@/components/ui/Button';
import { Copy, Check, Upload, X, FileText, Clock } from 'lucide-react';

function CopyField({ label, value }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2">
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-mono text-sm font-medium">{value}</p>
      </div>
      <button
        type="button"
        onClick={copy}
        className="ml-2 text-muted-foreground transition-colors hover:text-foreground"
      >
        {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}

function ProofThumbnail({ url, onRemove }) {
  const isPdf = url.toLowerCase().includes('.pdf') || url.includes('application/pdf');
  return (
    <div className="group relative h-20 w-20 overflow-hidden rounded-lg border bg-muted">
      {isPdf ? (
        <div className="flex h-full flex-col items-center justify-center gap-1 text-muted-foreground">
          <FileText className="h-6 w-6" />
          <span className="text-xs">PDF</span>
        </div>
      ) : (
        <Image src={url} alt="Récipissé" fill className="object-cover" />
      )}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute right-1 top-1 hidden rounded-full bg-black/60 p-0.5 text-white group-hover:flex"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

export default function BankTransferInfo({
  bankDetails,
  onInitiate,
  loading,
  bookingId,
  initialProofs = [],
}) {
  const [proofs, setProofs] = useState(initialProofs);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const inputRef = useRef(null);

  async function handleFiles(files) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadError('');

    const form = new FormData();
    for (const file of Array.from(files)) {
      form.append('receipt', file);
    }

    const res = await fetch(`/api/bookings/${bookingId}/receipt`, {
      method: 'POST',
      body: form,
    });
    const data = await res.json();
    setUploading(false);

    if (!data.success) return setUploadError(data.error);
    setProofs(data.data.proofs);
  }

  // Étape 1 : pas encore de coordonnées bancaires
  if (!bankDetails) {
    // Si onInitiate est null, c'est qu'on attend juste le chargement des données
    if (!onInitiate) {
      return (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      );
    }
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Cliquez sur le bouton ci-dessous pour obtenir les coordonnées bancaires et votre référence de virement.
        </p>
        <Button onClick={onInitiate} disabled={loading} className="w-full">
          {loading ? 'Génération...' : 'Obtenir les coordonnées bancaires'}
        </Button>
      </div>
    );
  }

  // Étape 2 : coordonnées affichées + upload récipissé
  return (
    <div className="space-y-4">
      {/* Avertissement */}
      <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm">
        <p className="font-medium text-warning">Important</p>
        <p className="mt-1 text-muted-foreground">
          Effectuez le virement avec exactement la référence indiquée. Uploadez ensuite votre récipissé
          ci-dessous pour accélérer la validation.
        </p>
      </div>

      {/* Coordonnées bancaires */}
      <div className="space-y-2">
        <CopyField label="Bénéficiaire" value={bankDetails.beneficiary} />
        <CopyField label="IBAN" value={bankDetails.iban} />
        <CopyField label="BIC / SWIFT" value={bankDetails.bic} />
        <CopyField label="Référence (obligatoire)" value={bankDetails.reference} />
        <CopyField label="Montant" value={formatPrice(bankDetails.amount)} />
      </div>

      {/* Upload récipissé */}
      <div className="space-y-3 rounded-lg border border-dashed p-4">
        <p className="text-sm font-medium">Récipissé de virement</p>
        <p className="text-xs text-muted-foreground">
          Uploadez votre preuve de virement (image ou PDF). Vous pouvez en ajouter plusieurs.
        </p>

        {/* Fichiers déjà uploadés */}
        {proofs.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {proofs.map((url) => (
              <ProofThumbnail key={url} url={url} />
            ))}
          </div>
        )}

        {uploadError && (
          <p className="text-xs text-destructive">{uploadError}</p>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="w-full"
        >
          <Upload className="mr-2 h-4 w-4" />
          {uploading ? 'Envoi en cours...' : proofs.length > 0 ? 'Ajouter un autre fichier' : 'Choisir un fichier'}
        </Button>
      </div>

      {/* Message de statut */}
      <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm">
        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
        <div>
          <p className="font-medium text-warning">Virement en cours de validation</p>
          <p className="mt-0.5 text-muted-foreground">
            Notre équipe vérifiera votre virement dans les 24–48h ouvrées. Vous recevrez un email de confirmation.
          </p>
        </div>
      </div>
    </div>
  );
}
