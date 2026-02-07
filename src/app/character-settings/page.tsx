'use client';

import { useState, useEffect, useCallback } from 'react';
import { Language, defaultLanguage } from '@/lib/i18n';
import { useAcornStore } from '@/lib/acorn-context';
import './character-settings.css';

// Character Types
interface Character {
    id: string;
    emoji: string;
    name: string;
    nameKo: string;
    unlockCost: number;
    description: string;
    descriptionKo: string;
}

interface Accessory {
    id: string;
    emoji: string;
    type: 'hat' | 'cape';
    cost: number;
}

interface Pet {
    id: string;
    emoji: string;
    name: string;
    nameKo: string;
    cost: number;
}

// Available Characters
const CHARACTERS: Character[] = [
    { id: 'bunny', emoji: '🐰', name: 'Bunny', nameKo: '토끼', unlockCost: 0, description: 'Hoppy and cheerful', descriptionKo: '통통 튀는 밝은 친구' },
    { id: 'fox', emoji: '🦊', name: 'Fox', nameKo: '여우', unlockCost: 0, description: 'Clever and swift', descriptionKo: '똑똑하고 빠른 친구' },
    { id: 'bear', emoji: '🐻', name: 'Bear', nameKo: '곰', unlockCost: 0, description: 'Warm and cuddly', descriptionKo: '따뜻하고 포근한 친구' },
    { id: 'cat', emoji: '🐱', name: 'Cat', nameKo: '고양이', unlockCost: 0, description: 'Graceful and calm', descriptionKo: '우아하고 차분한 친구' },
    { id: 'dog', emoji: '🐶', name: 'Dog', nameKo: '강아지', unlockCost: 0, description: 'Loyal and playful', descriptionKo: '충직하고 장난스러운 친구' },
    { id: 'penguin', emoji: '🐧', name: 'Penguin', nameKo: '펭귄', unlockCost: 100, description: 'Cool and stylish', descriptionKo: '쿨하고 스타일리시' },
    { id: 'panda', emoji: '🐼', name: 'Panda', nameKo: '판다', unlockCost: 150, description: 'Zen and peaceful', descriptionKo: '평화롭고 차분함' },
    { id: 'unicorn', emoji: '🦄', name: 'Unicorn', nameKo: '유니콘', unlockCost: 300, description: 'Magical and rare', descriptionKo: '마법같고 희귀함' },
    { id: 'dragon', emoji: '🐲', name: 'Dragon', nameKo: '용', unlockCost: 500, description: 'Legendary guardian', descriptionKo: '전설의 수호자' },
];

// Accessories
const HATS: Accessory[] = [
    { id: 'none', emoji: '❌', type: 'hat', cost: 0 },
    { id: 'acorn-hat', emoji: '🌰', type: 'hat', cost: 50 },
    { id: 'flower-crown', emoji: '🌸', type: 'hat', cost: 80 },
    { id: 'wizard-hat', emoji: '🧙', type: 'hat', cost: 120 },
    { id: 'crown', emoji: '👑', type: 'hat', cost: 200 },
    { id: 'halo', emoji: '😇', type: 'hat', cost: 250 },
];

const CAPES: Accessory[] = [
    { id: 'none', emoji: '❌', type: 'cape', cost: 0 },
    { id: 'leaf-cape', emoji: '🍃', type: 'cape', cost: 60 },
    { id: 'rainbow-cape', emoji: '🌈', type: 'cape', cost: 100 },
    { id: 'star-cape', emoji: '⭐', type: 'cape', cost: 150 },
    { id: 'night-cape', emoji: '🌙', type: 'cape', cost: 180 },
];

// Pets
const PETS: Pet[] = [
    { id: 'none', emoji: '❌', name: 'None', nameKo: '없음', cost: 0 },
    { id: 'squirrel', emoji: '🐿️', name: 'Squirrel', nameKo: '다람쥐', cost: 100 },
    { id: 'butterfly', emoji: '🦋', name: 'Butterfly', nameKo: '나비', cost: 80 },
    { id: 'firefly', emoji: '✨', name: 'Firefly', nameKo: '반딧불', cost: 120 },
    { id: 'owl', emoji: '🦉', name: 'Owl', nameKo: '부엉이', cost: 200 },
    { id: 'fairy', emoji: '🧚', name: 'Fairy', nameKo: '요정', cost: 350 },
];

const translations = {
    en: {
        title: 'Character Settings',
        back: '← Brookvale',
        namePlaceholder: 'Your Name',
        selectCharacter: '🎭 Choose Your Character',
        selectHat: '🎩 Hats',
        selectCape: '🧥 Capes',
        selectPet: '🐾 Companion Pet',
        save: 'Save & Enter Village',
        saved: 'Character Saved!',
        locked: 'Locked',
        free: 'Free',
        owned: 'Owned',
    },
    ko: {
        title: '캐릭터 설정',
        back: '← 브룩베일',
        namePlaceholder: '이름을 입력하세요',
        selectCharacter: '🎭 캐릭터 선택',
        selectHat: '🎩 모자',
        selectCape: '🧥 망토',
        selectPet: '🐾 펫 친구',
        save: '저장하고 마을 입장',
        saved: '캐릭터 저장됨!',
        locked: '잠김',
        free: '무료',
        owned: '보유중',
    },
};

// Character state interface for localStorage
interface CharacterState {
    characterId: string;
    name: string;
    hatId: string;
    capeId: string;
    petId: string;
    unlockedCharacters: string[];
    unlockedAccessories: string[];
    unlockedPets: string[];
}

const DEFAULT_STATE: CharacterState = {
    characterId: 'bunny',
    name: '',
    hatId: 'none',
    capeId: 'none',
    petId: 'none',
    unlockedCharacters: ['bunny', 'fox', 'bear', 'cat', 'dog'],
    unlockedAccessories: ['none'],
    unlockedPets: ['none'],
};

export default function CharacterSettingsPage() {
    const [language, setLanguage] = useState<Language>(defaultLanguage);
    const [state, setState] = useState<CharacterState>(DEFAULT_STATE);
    const [showToast, setShowToast] = useState(false);

    const { balance: totalAcorns, spend, isLoaded } = useAcornStore(language);
    const t = translations[language];

    // Load saved state
    useEffect(() => {
        const saved = localStorage.getItem('brookvaleCharacter');
        if (saved) {
            setState({ ...DEFAULT_STATE, ...JSON.parse(saved) });
        }
    }, []);

    // Get selected character
    const selectedCharacter = CHARACTERS.find(c => c.id === state.characterId) || CHARACTERS[0];

    // Check if item is unlocked
    const isCharacterUnlocked = (id: string) => state.unlockedCharacters.includes(id);
    const isAccessoryUnlocked = (id: string) => state.unlockedAccessories.includes(id);
    const isPetUnlocked = (id: string) => state.unlockedPets.includes(id);

    // Select character
    const selectCharacter = useCallback((char: Character) => {
        if (isCharacterUnlocked(char.id)) {
            setState(prev => ({ ...prev, characterId: char.id }));
        } else if (totalAcorns >= char.unlockCost) {
            // Unlock with acorns
            spend(char.unlockCost, language === 'ko' ? '캐릭터 해금' : 'Character Unlock');
            setState(prev => ({
                ...prev,
                characterId: char.id,
                unlockedCharacters: [...prev.unlockedCharacters, char.id],
            }));
        }
    }, [state.unlockedCharacters, totalAcorns, spend, language]);

    // Select accessory
    const selectAccessory = useCallback((acc: Accessory) => {
        const stateKey = acc.type === 'hat' ? 'hatId' : 'capeId';

        if (isAccessoryUnlocked(acc.id)) {
            setState(prev => ({ ...prev, [stateKey]: acc.id }));
        } else if (totalAcorns >= acc.cost) {
            spend(acc.cost, language === 'ko' ? '액세서리 구매' : 'Accessory Purchase');
            setState(prev => ({
                ...prev,
                [stateKey]: acc.id,
                unlockedAccessories: [...prev.unlockedAccessories, acc.id],
            }));
        }
    }, [state.unlockedAccessories, totalAcorns, spend, language]);

    // Select pet
    const selectPet = useCallback((pet: Pet) => {
        if (isPetUnlocked(pet.id)) {
            setState(prev => ({ ...prev, petId: pet.id }));
        } else if (totalAcorns >= pet.cost) {
            spend(pet.cost, language === 'ko' ? '펫 구매' : 'Pet Purchase');
            setState(prev => ({
                ...prev,
                petId: pet.id,
                unlockedPets: [...prev.unlockedPets, pet.id],
            }));
        }
    }, [state.unlockedPets, totalAcorns, spend, language]);

    // Save and navigate
    const saveCharacter = useCallback(() => {
        localStorage.setItem('brookvaleCharacter', JSON.stringify(state));
        setShowToast(true);
        setTimeout(() => {
            setShowToast(false);
            window.location.href = '/';
        }, 1500);
    }, [state]);

    // Get display items
    const getHat = () => HATS.find(h => h.id === state.hatId);
    const getCape = () => CAPES.find(c => c.id === state.capeId);
    const getPet = () => PETS.find(p => p.id === state.petId);

    if (!isLoaded) {
        return <div className="character-settings-app">Loading...</div>;
    }

    return (
        <div className="character-settings-app">
            {/* Toast */}
            {showToast && (
                <div className="save-toast">
                    <span>✨</span>
                    <span>{t.saved}</span>
                </div>
            )}

            {/* Header */}
            <header className="app-header">
                <a href="/" className="back-link">{t.back}</a>
                <h1>🎭 {t.title}</h1>
                <span className="acorn-badge">🌰 {totalAcorns}</span>
            </header>

            {/* Preview */}
            <section className="preview-section">
                <div className="preview-stage">
                    <div className="character-preview">
                        {selectedCharacter.emoji}
                    </div>
                </div>
                <input
                    type="text"
                    className="character-name-input"
                    placeholder={t.namePlaceholder}
                    value={state.name}
                    onChange={(e) => setState(prev => ({ ...prev, name: e.target.value }))}
                    maxLength={12}
                />
            </section>

            {/* Character Selection */}
            <section className="selection-section">
                <h2>{t.selectCharacter}</h2>
                <div className="character-grid">
                    {CHARACTERS.map(char => {
                        const unlocked = isCharacterUnlocked(char.id);
                        return (
                            <div
                                key={char.id}
                                className={`character-option ${state.characterId === char.id ? 'selected' : ''} ${!unlocked ? 'locked' : ''}`}
                                onClick={() => selectCharacter(char)}
                            >
                                <div className="char-emoji">{char.emoji}</div>
                                <div className="char-name">
                                    {language === 'ko' ? char.nameKo : char.name}
                                </div>
                                {!unlocked && (
                                    <div className="char-locked">🌰 {char.unlockCost}</div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Hats */}
            <section className="selection-section">
                <h2>{t.selectHat}</h2>
                <div className="accessory-grid">
                    {HATS.map(hat => {
                        const unlocked = isAccessoryUnlocked(hat.id);
                        return (
                            <div
                                key={hat.id}
                                className={`accessory-option ${state.hatId === hat.id ? 'selected' : ''} ${!unlocked ? 'locked' : ''}`}
                                onClick={() => selectAccessory(hat)}
                            >
                                <div className="acc-emoji">{hat.emoji}</div>
                                {!unlocked && hat.cost > 0 && (
                                    <div className="acc-price">🌰 {hat.cost}</div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Capes */}
            <section className="selection-section">
                <h2>{t.selectCape}</h2>
                <div className="accessory-grid">
                    {CAPES.map(cape => {
                        const unlocked = isAccessoryUnlocked(cape.id);
                        return (
                            <div
                                key={cape.id}
                                className={`accessory-option ${state.capeId === cape.id ? 'selected' : ''} ${!unlocked ? 'locked' : ''}`}
                                onClick={() => selectAccessory(cape)}
                            >
                                <div className="acc-emoji">{cape.emoji}</div>
                                {!unlocked && cape.cost > 0 && (
                                    <div className="acc-price">🌰 {cape.cost}</div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Pets */}
            <section className="selection-section">
                <h2>{t.selectPet}</h2>
                <div className="pet-grid">
                    {PETS.map(pet => {
                        const unlocked = isPetUnlocked(pet.id);
                        return (
                            <div
                                key={pet.id}
                                className={`pet-option ${state.petId === pet.id ? 'selected' : ''} ${!unlocked ? 'locked' : ''}`}
                                onClick={() => selectPet(pet)}
                            >
                                <div className="pet-emoji">{pet.emoji}</div>
                                <div className="pet-name">
                                    {language === 'ko' ? pet.nameKo : pet.name}
                                </div>
                                {!unlocked && pet.cost > 0 && (
                                    <div className="pet-price">🌰 {pet.cost}</div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Save Button */}
            <section className="save-section">
                <button className="save-btn" onClick={saveCharacter}>
                    {t.save} →
                </button>
            </section>
        </div>
    );
}
