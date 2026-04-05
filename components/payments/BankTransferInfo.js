import { useState } from 'react';
import { formatPrice } from '@/lib/constants';
import { Button } from '@/components/ui/Button';
import { Copy, Check } from 'lucide-react';

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
      <button onClick={copy} className="ml-2 text-muted-foreground hover:text-foreground transition-colors">
        {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}

export default function BankTransferInfo({ bankDetails, onInitiate, loading }) {
  if (!bankDetails) {
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

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm">
        <p className="font-medium text-warning">Important</p>
        <p className="mt-1 text-muted-foreground">
          Effectuez le virement avec exactement la référence indiquée. Votre réservation sera
          confirmée après validation par notre équipe (24–48h ouvrées).
        </p>
      </div>

      <div className="space-y-2">
        <CopyField label="Bénéficiaire" value={bankDetails.beneficiary} />
        <CopyField label="IBAN" value={bankDetails.iban} />
        <CopyField label="BIC / SWIFT" value={bankDetails.bic} />
        <CopyField label="Référence (obligatoire)" value={bankDetails.reference} />
        <CopyField label="Montant" value={formatPrice(bankDetails.amount)} />
      </div>

      <p className="text-xs text-muted-foreground">
        Vous recevrez un email de confirmation dès validation de votre paiement.
      </p>
    </div>
  );
}
