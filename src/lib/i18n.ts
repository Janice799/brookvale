// ==================== BROOKVALE i18n SYSTEM ====================
// Supports: English (default), Korean
// Easy to add more languages later!

export type Language = 'en' | 'ko';

export const translations = {
    en: {
        // Hero Screen
        hero: {
            title: 'Brookvale',
            subtitle: 'Where Your Daily Life Flows',
            description: '🌲 Explore the 3D village freely\nWASD to move | Mouse drag to rotate | Click buildings to launch apps',
            enterButton: 'Enter 3D Village',
            controls: 'WASD Move | Mouse Drag Rotate | Click → App',
        },

        // Quest System
        quest: {
            todayMissions: "Today's Missions",
            progress: 'Progress',
            completed: 'Completed!',
            inProgress: 'In Progress',
            locked: 'Locked',
            reward: 'Reward',
            acorns: 'Acorns',
            xp: 'XP',
            claimReward: 'Claim Reward',
            goToLocation: 'Go to Location',
            questComplete: 'Quest Complete!',
            newQuestUnlocked: 'New Quest Unlocked!',
            dailyReset: 'Quests reset in',
            hours: 'h',
            minutes: 'm',
        },

        // Zones
        zones: {
            forest: 'Northern Forest',
            town: 'Brookvale Town',
            lake: 'Mystic Lake',
            hill: 'Starlight Hill',
            cloud: 'Cloud Haven',
        },

        // Landmarks
        landmarks: {
            'tiny-wins': { name: 'Tiny Wins Garden', desc: 'Small habits become a forest' },
            'focus-cat': { name: 'Focus Cat', desc: 'A cat that helps you concentrate' },
            'stretch-timer': { name: 'Stretch Timer', desc: 'Quick stretching routines' },
            'goal-tycoon': { name: 'Goal Tycoon', desc: 'Build a village with goals' },
            'daily-quest': { name: 'Daily Quest', desc: "Today's missions" },
            'acorn-archive': { name: 'Acorn Archive', desc: 'The acorn library' },
            'vibe-painter': { name: 'Vibe Painter', desc: "Today's emotions in colors" },
            'karma-ripple': { name: 'Karma Ripple', desc: 'Good ripples' },
            'menu-oracle': { name: 'Menu Oracle', desc: 'What to eat today?' },
            'rhythm-surfer': { name: 'Rhythm Surfer', desc: 'Bio rhythm' },
            'dream-catcher': { name: 'Dream Catcher', desc: 'Draw your dreams' },
            'star-note': { name: 'Star Note', desc: 'Gratitude journal' },
            'breath-bubble': { name: 'Breath Bubble', desc: 'Peaceful breathing' },
            'mind-cloud': { name: 'Mind Cloud', desc: 'Short meditation' },
            'sleep-nest': { name: 'Sleep Nest', desc: 'Sleep preparation' },
        },

        // UI
        ui: {
            launchApp: 'Launch App →',
            close: 'Close',
            settings: 'Settings',
            language: 'Language',
            level: 'Level',
            totalAcorns: 'Total Acorns',
        },

        // Quests List
        quests: {
            focusSession: { title: 'Complete Focus Session', desc: 'Stay focused for 25 minutes with Focus Cat' },
            addHabit: { title: 'Plant a Habit Seed', desc: 'Add a new habit in Tiny Wins Garden' },
            stretchSession: { title: 'Complete Stretching', desc: 'Do a quick stretch routine' },
            dailyGoal: { title: 'Set Daily Goal', desc: 'Create your goal for today' },
            exploreTown: { title: 'Explore the Town', desc: 'Visit 3 different locations' },
            paintMood: { title: 'Paint Your Mood', desc: 'Express your feelings in Vibe Painter' },
        },
    },

    ko: {
        // Hero Screen
        hero: {
            title: 'Brookvale',
            subtitle: '당신의 일상이 흐르는 마을',
            description: '🌲 3D 마을을 자유롭게 탐험하세요\nWASD로 이동 | 마우스 드래그로 회전 | 건물 클릭으로 앱 실행',
            enterButton: '3D 마을 입장',
            controls: 'WASD 이동 | 마우스 드래그 회전 | 클릭 → 앱',
        },

        // Quest System
        quest: {
            todayMissions: '오늘의 미션',
            progress: '진행률',
            completed: '완료!',
            inProgress: '진행 중',
            locked: '잠김',
            reward: '보상',
            acorns: '도토리',
            xp: '경험치',
            claimReward: '보상 받기',
            goToLocation: '위치로 이동',
            questComplete: '미션 완료!',
            newQuestUnlocked: '새 미션 해금!',
            dailyReset: '미션 초기화까지',
            hours: '시간',
            minutes: '분',
        },

        // Zones
        zones: {
            forest: '북쪽 숲',
            town: '브룩베일 타운',
            lake: '신비의 호수',
            hill: '별빛 언덕',
            cloud: '구름 쉼터',
        },

        // Landmarks
        landmarks: {
            'tiny-wins': { name: '타이니 윈즈 가든', desc: '작은 습관이 숲이 됩니다' },
            'focus-cat': { name: '포커스 캣', desc: '집중을 도와주는 고양이' },
            'stretch-timer': { name: '스트레칭 타이머', desc: '짧은 스트레칭 루틴' },
            'goal-tycoon': { name: '골 타이쿤', desc: '목표로 마을을 건설' },
            'daily-quest': { name: '데일리 퀘스트', desc: '오늘의 미션' },
            'acorn-archive': { name: '도토리 도서관', desc: '도토리 아카이브' },
            'vibe-painter': { name: '바이브 페인터', desc: '오늘의 감정을 색으로' },
            'karma-ripple': { name: '카르마 리플', desc: '선한 파동' },
            'menu-oracle': { name: '메뉴 오라클', desc: '오늘 뭐 먹지?' },
            'rhythm-surfer': { name: '리듬 서퍼', desc: '바이오 리듬' },
            'dream-catcher': { name: '드림 캐쳐', desc: '꿈을 그림으로' },
            'star-note': { name: '스타 노트', desc: '감사 일기' },
            'breath-bubble': { name: '숨쉬기 버블', desc: '평화로운 호흡' },
            'mind-cloud': { name: '마인드 클라우드', desc: '짧은 명상' },
            'sleep-nest': { name: '슬립 네스트', desc: '수면 준비' },
        },

        // UI
        ui: {
            launchApp: '앱 실행하기 →',
            close: '닫기',
            settings: '설정',
            language: '언어',
            level: '레벨',
            totalAcorns: '총 도토리',
        },

        // Quests List
        quests: {
            focusSession: { title: '집중 세션 완료하기', desc: 'Focus Cat에서 25분 집중하기' },
            addHabit: { title: '습관 씨앗 심기', desc: 'Tiny Wins Garden에서 새 습관 추가하기' },
            stretchSession: { title: '스트레칭 하기', desc: '짧은 스트레칭 루틴 완료하기' },
            dailyGoal: { title: '오늘의 목표 세우기', desc: '오늘의 목표를 만들기' },
            exploreTown: { title: '마을 탐험하기', desc: '3곳의 다른 장소 방문하기' },
            paintMood: { title: '기분 그리기', desc: 'Vibe Painter에서 감정 표현하기' },
        },
    },
} as const;

// Hook for getting translations
export function getTranslation(lang: Language) {
    return translations[lang];
}

// Default language
export const defaultLanguage: Language = 'en';
