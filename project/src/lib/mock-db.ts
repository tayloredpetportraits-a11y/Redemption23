import fs from 'fs';
import path from 'path';
import { Order, Image } from '@/lib/supabase/client';

const DB_PATH = path.join(process.cwd(), 'local-db.json');

interface Database {
    orders: Order[];
    images: Image[];
}

function readDb(): Database {
    if (!fs.existsSync(DB_PATH)) {
        // Initialize file immediately
        const initialDetails = { orders: [], images: [] };
        try {
            fs.writeFileSync(DB_PATH, JSON.stringify(initialDetails, null, 2));
        } catch (e) {
            console.error("Failed to init DB", e);
        }
        return initialDetails;
    }
    try {
        return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    } catch (e) {
        console.error("Failed to read DB", e);
        return { orders: [], images: [] };
    }
}

function writeDb(data: Database) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

export const mockDb = {
    async insertOrder(order: Partial<Order>) {
        const db = readDb();
        const newOrder: Order = {
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
            status: 'pending',
            pet_name: null,
            order_number: `ORD-${Date.now()}`,
            customer_name: 'Guest',
            customer_email: 'guest@example.com',
            product_type: 'royalty',
            payment_status: 'paid',
            social_consent: false,
            social_handle: null,
            marketing_consent: false,
            consent_date: null,
            rating: null,
            review_text: null,
            revision_status: 'none',
            revision_notes: null,
            access_token: null,
            selected_image_id: null,
            selected_print_product: null,
            customer_notes: null,
            bonus_unlocked: false,
            bonus_payment_status: 'unpaid',
            stripe_session_id: null,
            viewed_at: null,
            downloaded_count: 0,
            bonus_conversion: false,
            upsell_conversion: false,
            share_count: 0,
            ...order
        } as Order;

        db.orders.push(newOrder);
        writeDb(db);
        return newOrder;
    },

    async insertImages(images: Partial<Image>[]) {
        const db = readDb();
        const newImages = images.map(img => ({
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
            status: 'pending_review',
            watermarked_url: null,
            ...img
        })) as Image[];

        db.images.push(...newImages);
        writeDb(db);
        return newImages;
    },

    async getImagesByStatus(status: string) {
        const db = readDb();
        return db.images.filter(img => img.status === status);
    },

    async updateImageStatus(id: string, status: 'approved' | 'rejected') {
        const db = readDb();
        const img = db.images.find(i => i.id === id);
        if (img) {
            img.status = status;
            writeDb(db);
        }
    },

    async getImage(id: string) {
        const db = readDb();
        return db.images.find(i => i.id === id);
    },

    async getOrder(id: string) {
        const db = readDb();
        return db.orders.find(o => o.id === id);
    },

    async getOrders(ids: string[]) {
        const db = readDb();
        return db.orders.filter(o => ids.includes(o.id));
    },

    async getImagesByOrderId(orderId: string) {
        const db = readDb();
        return db.images.filter(img => img.order_id === orderId);
    },

    async getPendingOrders() {
        const db = readDb();
        return db.orders.filter(o => o.status === 'pending');
    },

    async getAllOrders() {
        const db = readDb();
        return db.orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },

    async updateOrderStatus(id: string, status: Order['status']) {
        const db = readDb();
        const order = db.orders.find(o => o.id === id);
        if (order) {
            order.status = status;
            writeDb(db);
        }
    }
};
