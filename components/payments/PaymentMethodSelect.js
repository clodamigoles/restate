import { CreditCard, Building2 } from 'lucide-react';

export default function PaymentMethodSelect({ value, onChange }) {
  const methods = [
    {
      id: 'card',
      label: 'Carte bancaire',
      description: 'Paiement sécurisé par carte Visa, Mastercard ou American Express.',
      icon: <CreditCard className="h-5 w-5" />,
    },
    // {
    //   id: 'paypal',
    //   label: 'PayPal',
    //   description: 'Paiement sécurisé via PayPal. Confirmation immédiate.',
    //   icon: <CreditCard className="h-5 w-5" />,
    // },
    {
      id: 'bank_transfer',
      label: 'Virement bancaire',
      description: 'Virement sur notre compte. Validation sous 24–48h ouvrées.',
      icon: <Building2 className="h-5 w-5" />,
    },
  ];

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold">Choisir un mode de paiement</p>
      {methods.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => onChange(m.id)}
          className={`flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors ${
            value === m.id
              ? 'border-primary bg-primary/5'
              : 'hover:border-primary/40'
          }`}
        >
          <div className={`mt-0.5 shrink-0 ${value === m.id ? 'text-primary' : 'text-muted-foreground'}`}>
            {m.icon}
          </div>
          <div>
            <p className="font-medium">{m.label}</p>
            <p className="text-sm text-muted-foreground">{m.description}</p>
          </div>
          <div className={`ml-auto mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 ${
            value === m.id ? 'border-primary bg-primary' : 'border-muted-foreground'
          }`} />
        </button>
      ))}
    </div>
  );
}
