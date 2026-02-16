import GlobalNav from '@/components/GlobalNav';

export default function DashboardLayout({
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
