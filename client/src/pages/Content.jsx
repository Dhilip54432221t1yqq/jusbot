import { useEffect } from 'react';
import { supabase } from '../supabase';
import ContentManager from '../components/ContentManager';
import { useParams } from 'react-router-dom';

export default function ContentPage() {
    const { workspaceId } = useParams();

    useEffect(() => {
        const getUser = async () => {
            await supabase.auth.getUser();
        };
        getUser();
    }, []);

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
            <ContentManager isModal={false} workspaceId={workspaceId} onClose={() => {}} />
        </div>
    );
}
