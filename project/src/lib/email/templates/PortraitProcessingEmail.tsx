
interface PortraitProcessingEmailProps {
    customerName: string;
    petName: string;
}

export default function PortraitProcessingEmail({
    customerName,
    petName
}: PortraitProcessingEmailProps) {
    return (
        <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
            <h1 style={{ color: '#7C3AED', marginBottom: '20px' }}>Paw-some news, {customerName}!</h1>

            <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#333' }}>
                We've received your order for <strong>{petName}</strong>.
            </p>

            <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#333' }}>
                Our AI artists are starting work on your portrait right now. 🎨
            </p>

            <div style={{
                background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
                padding: '20px',
                borderRadius: '8px',
                margin: '30px 0',
                color: 'white'
            }}>
                <p style={{ margin: 0, fontSize: '14px' }}>
                    ✨ Estimated completion: <strong>15-30 minutes</strong>
                </p>
            </div>

            <p style={{ fontSize: '14px', color: '#666', marginTop: '30px' }}>
                You'll receive another email when your portraits are ready to view.
                We can't wait to show you the results!
            </p>

            <p style={{ fontSize: '12px', color: '#999', marginTop: '40px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                Questions? Reply to this email and we'll help!<br />
                Pet Portraits by Taylored Solutions
            </p>
        </div>
    );
}
