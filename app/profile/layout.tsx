import GlobalNav from '@/components/GlobalNav';

export default function ProfileLayout({
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
