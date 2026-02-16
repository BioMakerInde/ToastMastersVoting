import GlobalNav from '@/components/GlobalNav';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <GlobalNav />
            {children}
        </>
    );
}
