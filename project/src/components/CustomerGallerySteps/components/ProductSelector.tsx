import { type Product } from '@/lib/config';

interface ProductSelectorProps {
    products: Product[];
    printProduct: string;
    setPrintProduct: (id: string) => void;
}

export default function ProductSelector({ products, printProduct, setPrintProduct }: ProductSelectorProps) {
    return (
        <section className="space-y-3">
            <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wide">2. Choose Size</h3>
            <div className="grid grid-cols-2 gap-3">
                {products.map((product) => (
                    <div
                        key={product.id}
                        onClick={() => setPrintProduct(product.id)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${printProduct === product.id
                            ? 'border-brand-navy bg-brand-blue/10 shadow-md transform scale-[1.02]'
                            : 'border-zinc-200 bg-white hover:border-brand-blue/50 hover:shadow-lg'
                            }`}
                    >
                        <div className="font-bold text-brand-navy text-lg">{product.name}</div>
                        <div className="text-sm text-zinc-500 mt-1">{product.description}</div>
                        <div className="text-brand-navy font-bold mt-2 text-base">${product.price}</div>
                    </div>
                ))}
            </div>
        </section>
    );
}
