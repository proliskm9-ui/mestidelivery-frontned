import React from 'react';
import Sheet from './Sheet';
import { useLanguage } from '../../translations/LanguageContext';
import './AvatarPickerSheet.css';

export const PRESET_AVATARS = [
    { id: 'av1', img: '/Assets/photo_2026-02-11_23-14-10.jpg', label: 'Art 1' },
    { id: 'av2', img: '/Assets/photo_2026-02-11_23-14-27.jpg', label: 'Art 2' },
    { id: 'av3', img: '/Assets/photo_2026-02-11_23-14-50.jpg', label: 'Art 3' },
    { id: 'av4', img: '/Assets/photo_2026-02-11_23-19-47.jpg', label: 'Art 4' },
];

interface AvatarPickerSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    current?: string | null;
    /** Preset image path or an uploaded photo as a data URL. */
    onPick: (avatar: string) => void;
}

/** Profile avatar: pick a preset or upload a photo. */
const AvatarPickerSheet: React.FC<AvatarPickerSheetProps> = ({ open, onOpenChange, current, onPick }) => {
    const { t } = useLanguage();
    const pick = (avatar: string) => { onPick(avatar); onOpenChange(false); };

    return (
        <Sheet
            open={open}
            onOpenChange={onOpenChange}
            title={t('profile.choose_avatar')}
            description={t('profile.choose_avatar_hint')}
            footer={
                <label className="ds-btn ds-btn--secondary">
                    {t('profile.upload_photo')}
                    <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onloadend = () => pick(String(reader.result));
                            reader.readAsDataURL(file);
                        }}
                    />
                </label>
            }
        >
            <div className="avatar-picker-grid">
                {PRESET_AVATARS.map((av) => (
                    <button
                        key={av.id}
                        type="button"
                        className={current === av.img ? 'avatar-picker-item is-active' : 'avatar-picker-item'}
                        onClick={() => pick(av.img)}
                        aria-label={av.label}
                        aria-pressed={current === av.img}
                    >
                        <img src={av.img} alt="" />
                    </button>
                ))}
            </div>
        </Sheet>
    );
};

export default AvatarPickerSheet;
