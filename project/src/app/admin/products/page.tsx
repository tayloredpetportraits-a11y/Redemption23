
import { MOCKUP_CONFIGS } from '@/lib/mockup-config';
import { PrintifySyncService } from '@/lib/printify/sync-service';
import { SyncButton } from './SyncButton';
import { MockupSelect } from './MockupSelect';
import { AddTemplateModal } from './AddTemplateModal';
import { MockupTemplateService } from '@/lib/mockup-templates/service';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
    let products: any[] = [];
    let errorMsg = null;
    let dynamicTemplates: any[] = [];

    // Fetch Products
    try {
        products = await PrintifySyncService.getSyncedProducts();
    } catch (e: any) {
        errorMsg = e.message;
    }

    // Fetch Dynamic Templates
    try {
        dynamicTemplates = await MockupTemplateService.getTemplates();
    } catch (e) {
        console.error("Template fetch error", e);
    }

    // Prepare Options
    const hardcoded = Object.keys(MOCKUP_CONFIGS).map(key => ({
        value: key,
        label: '[System] ' + key.charAt(0).toUpperCase() + key.slice(1)
    }));

    const dynamicOptions = dynamicTemplates.map(t => ({
        value: `db:${t.id}`,
        label: t.name
    }));

    const mockupOptions = [...hardcoded, ...dynamicOptions];

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Product Registry</h2>
                <div className="flex items-center gap-2">
                    <SyncButton />
                </div>
            </div>
            <Separator className="my-4" />

            {errorMsg && (
                <div className="bg-red-50 text-red-600 p-4 rounded-md mb-4 border border-red-200">
                    <strong>Error loading products:</strong> {errorMsg}
                    <p className="text-sm mt-1">Please ensure database migrations are applied.</p>
                </div>
            )}

            <div className="rounded-md border">
                <table className="w-full text-sm text-left">
                    <thead className="bg-zinc-50 border-b font-medium text-zinc-500">
                        <tr>
                            <th className="p-4 w-16">Img</th>
                            <th className="p-4">Product Title</th>
                            <th className="p-4">Blueprint</th>
                            <th className="p-4">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {products.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-zinc-500">
                                    No products found. Click "Sync" to fetch from Printify.
                                </td>
                            </tr>
                        ) : (
                            products.map((product) => (
                                <tr key={product.id} className="hover:bg-zinc-50/50">
                                    <td className="p-4">
                                        {product.image_url ? (
                                            <img src={product.image_url} alt="" className="w-10 h-10 object-cover rounded border" />
                                        ) : (
                                            <div className="w-10 h-10 bg-zinc-100 rounded border" />
                                        )}
                                    </td>
                                    <td className="p-4 font-medium">{product.title}</td>
                                    <td className="p-4 text-zinc-500 text-xs">ID: {product.blueprint_id}</td>
                                    <td className="p-4">
                                        {product.is_active ?
                                            <span className="text-green-600 text-xs font-medium bg-green-50 px-2 py-1 rounded-full">Active</span> :
                                            <span className="text-zinc-400 text-xs">Inactive</span>
                                        }
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 text-xs text-zinc-500">
                <p>Showing {products.length} products synced from Printify.</p>
            </div>
        </div>
    );
}

// Minimal Separator component
function Separator({ className }: { className?: string }) {
    return <div className={`h-[1px] w-full bg-zinc-200 ${className}`} />;
}
