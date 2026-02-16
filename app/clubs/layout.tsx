import GlobalNav from '@/components/GlobalNav';

export default function ClubsLayout({
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
