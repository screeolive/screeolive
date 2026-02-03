import { RoomComponent } from "@/components/pages/MeetingRoom";

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <RoomComponent params={{
        id: id
    }}  />;
}