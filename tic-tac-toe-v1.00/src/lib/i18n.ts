import type { Language } from './storage';

const en = {
  eyebrow: 'THE CLASSIC, REIMAGINED', tagline: 'A little strategy. A lot of satisfaction.',
  mode: 'GAME MODE', vsAi: 'VS COMPUTER', twoPlayers: 'TWO PLAYERS', practice: 'PRACTICE',
  chooseDifficulty: 'DIFFICULTY', easy: 'Easy', medium: 'Medium', hard: 'Hard', veryHard: 'Very Hard', impossible: 'Impossible',
  easyDescription: 'Random legal moves. Great for learning.', mediumDescription: 'Spots immediate wins and blocks, with simple strategy.', hardDescription: 'Searches several moves ahead and weighs threats.', veryHardDescription: 'Near-perfect play, with rare strategic mistakes.', impossibleDescription: 'Perfect play. You can only force a draw.',
  youPlayAs: 'YOUR MARK', chooseSide: 'Play as', yourTurn: 'Your turn', aiThinking: 'Thinking',
  xTurn: "X's turn", oTurn: "O's turn", yourMove: 'Make your move', aiMove: 'Opponent is thinking…',
  playerX: 'Player X', playerO: 'Player O', you: 'YOU', computer: 'AI', player: 'PLAYER',
  wins: 'WINS', draws: 'DRAWS', score: 'MATCH SCORE', newGame: 'New match', restart: 'Restart round',
  nextRound: 'Play next round', youWon: 'You won!', aiWon: 'Computer wins', xWon: 'Player X wins!', oWon: 'Player O wins!',
  drawResult: "It's a draw", practiceWon: 'Nice one!', practiceDraw: 'Good practice', roundReady: 'Ready when you are',
  settings: 'Settings', appearance: 'APPEARANCE', theme: 'Theme', dark: 'Dark', light: 'Light',
  language: 'Language', english: 'English', arabic: 'العربية', sound: 'Sound effects', on: 'On', off: 'Off',
  preferences: 'PREFERENCES', statistics: 'Your statistics', allMatches: 'Matches played', playerWins: 'Player wins', humanWins: 'Your wins', aiWins: 'AI wins', statisticsScope: 'Totals cover all competitive modes; practice rounds are excluded.',
  bestStreak: 'Best win streak vs AI', currentStreak: 'Current win streak vs AI', resetStats: 'Reset statistics', resetConfirm: 'Reset all saved statistics? This cannot be undone.',
  statsReset: 'Statistics reset', reset: 'Reset', cancel: 'Cancel', about: 'About', siteNavigation: 'Site navigation', strategyGuide: 'Strategy guide', privacyPolicy: 'Privacy', termsOfUse: 'Terms', contact: 'Contact', advertisement: 'Advertisement',
  accessibilityBoard: 'Tic-tac-toe board', row: 'Row', column: 'Column', empty: 'empty', occupiedBy: 'occupied by', winningCell: 'winning cell', tryAgain: 'Give it another go.',
  vs: 'VS', round: 'ROUND', strategy: 'Think one move ahead.', mark: 'MARK', active: 'ACTIVE',
  practiceNote: 'Practice mode never changes your competitive stats.', languageDirection: 'ltr',
  newMatchConfirm: 'Start a new match? Your current match score will be cleared.', newMatchTitle: 'Start a new match?',
  aiLabel: 'A clever little challenge', localLabel: 'Pass the device and play together', practiceLabel: 'Try ideas, learn patterns',
  noStatsYet: 'Your story starts with the first match.', statWins: 'Wins', statLosses: 'Losses', statDraws: 'Draws',
  soundUnavailable: 'Sound is unavailable in this browser.', close: 'Close', home: 'Home', gameArea: 'Game area', rematchReady: 'Ready for another round?', brandEdition: 'VERSION 1.00', playYourWay: 'PLAY YOUR WAY', designedToThinkDifferent: 'DESIGNED TO THINK DIFFERENT',
  undo: 'Undo', hint: 'Hint', moveNumber: 'Move', suggestedMove: 'suggested move', moveHistory: 'Move history', noMoves: 'No moves yet', lastMove: 'Last move', hintShown: 'A suggested move is highlighted on the board.', roundComplete: 'Round complete', gameInProgress: 'Game in progress', pageTitle: 'tic-tac-toe v1.00 — Free Strategy Game', pageDescription: 'Play tic-tac-toe against five AI difficulty levels or a friend. Free bilingual browser gameplay, with progress saved locally.',
  modeChangeTitle: 'Switch game mode?', modeChangeConfirm: 'Start a fresh match in this mode? The current board and match score will be cleared, but permanent statistics will be kept.', markChangeTitle: 'Change your mark?', markChangeConfirm: 'Apply this mark and start a fresh match? The current board and match score will be cleared.', roundSettingTitle: 'Restart this round?', roundSettingConfirm: 'Apply this setting and restart the current round? Your match score will be kept.', applyChange: 'Apply & restart',
} as const;
const ar: Record<keyof typeof en, string> = {
  eyebrow: 'اللعبة الكلاسيكية بروح جديدة', tagline: 'قليل من التخطيط، والكثير من المتعة.',
  mode: 'وضع اللعب', vsAi: 'ضد الكمبيوتر', twoPlayers: 'لاعبان', practice: 'تدريب',
  chooseDifficulty: 'مستوى الصعوبة', easy: 'سهل', medium: 'متوسط', hard: 'صعب', veryHard: 'صعب جدًا', impossible: 'مستحيل',
  easyDescription: 'حركات قانونية عشوائية للتعلّم بسهولة.', mediumDescription: 'يستغل الفوز المباشر ويصدّ التهديدات الوشيكة.', hardDescription: 'يحلّل عدة حركات ويتعامل مع التهديدات.', veryHardDescription: 'لعب شبه مثالي مع أخطاء استراتيجية نادرة.', impossibleDescription: 'لعب مثالي؛ أقصى ما يمكنك فرضه هو التعادل.',
  youPlayAs: 'علامتك', chooseSide: 'العب بـ', yourTurn: 'دورك', aiThinking: 'يفكر',
  xTurn: 'دور X', oTurn: 'دور O', yourMove: 'اختر حركتك', aiMove: 'الخصم يفكر…',
  playerX: 'اللاعب X', playerO: 'اللاعب O', you: 'أنت', computer: 'الكمبيوتر', player: 'اللاعب',
  wins: 'فوز', draws: 'تعادل', score: 'نتيجة المباراة', newGame: 'مباراة جديدة', restart: 'إعادة الجولة',
  nextRound: 'الجولة التالية', youWon: 'لقد فزت!', aiWon: 'فاز الكمبيوتر', xWon: 'فاز اللاعب X!', oWon: 'فاز اللاعب O!',
  drawResult: 'انتهت بالتعادل', practiceWon: 'أحسنت!', practiceDraw: 'تدريب جيد', roundReady: 'هل أنت مستعد؟',
  settings: 'الإعدادات', appearance: 'المظهر', theme: 'السمة', dark: 'داكن', light: 'فاتح',
  language: 'اللغة', english: 'English', arabic: 'العربية', sound: 'المؤثرات الصوتية', on: 'تشغيل', off: 'إيقاف',
  preferences: 'التفضيلات', statistics: 'إحصائياتك', allMatches: 'المباريات المكتملة', playerWins: 'انتصارات اللاعبين', humanWins: 'انتصاراتك', aiWins: 'انتصارات الكمبيوتر', statisticsScope: 'تشمل الإجماليات جميع أوضاع اللعب التنافسية، ولا يشمل وضع التدريب.',
  bestStreak: 'أفضل سلسلة فوز ضد الكمبيوتر', currentStreak: 'سلسلة الفوز الحالية ضد الكمبيوتر', resetStats: 'إعادة ضبط الإحصائيات', resetConfirm: 'هل تريد حذف جميع الإحصائيات المحفوظة؟ لا يمكن التراجع.',
  statsReset: 'تمت إعادة ضبط الإحصائيات', reset: 'إعادة الضبط', cancel: 'إلغاء', about: 'عن اللعبة', siteNavigation: 'روابط الموقع', strategyGuide: 'دليل الاستراتيجية', privacyPolicy: 'الخصوصية', termsOfUse: 'الشروط', contact: 'تواصل معنا', advertisement: 'إعلان',
  accessibilityBoard: 'لوحة إكس-أو', row: 'الصف', column: 'العمود', empty: 'فارغ', occupiedBy: 'يشغله', winningCell: 'خلية فائزة', tryAgain: 'حاول مرة أخرى.',
  vs: 'ضد', round: 'الجولة', strategy: 'خطوة واحدة للأمام.', mark: 'العلامة', active: 'الدور الحالي',
  practiceNote: 'وضع التدريب لا يؤثر على إحصائياتك التنافسية.', languageDirection: 'rtl',
  newMatchConfirm: 'بدء مباراة جديدة؟ سيتم تصفير نتيجة المباراة الحالية.', newMatchTitle: 'بدء مباراة جديدة؟',
  aiLabel: 'تحدٍ ذكي ولطيف', localLabel: 'مرّر الجهاز والعبوا معًا', practiceLabel: 'جرّب أفكارًا وتعلّم الأنماط',
  noStatsYet: 'تبدأ قصتك من المباراة الأولى.', statWins: 'فوز', statLosses: 'خسارة', statDraws: 'تعادل',
  soundUnavailable: 'الصوت غير متاح في هذا المتصفح.', close: 'إغلاق', home: 'الرئيسية', gameArea: 'منطقة اللعب', rematchReady: 'هل أنت مستعد لجولة أخرى؟', brandEdition: 'الإصدار ١.٠٠', playYourWay: 'العب بطريقتك', designedToThinkDifferent: 'صُممت لتفكر بطريقة مختلفة',
  undo: 'تراجع', hint: 'تلميح', moveNumber: 'الحركة', suggestedMove: 'الحركة المقترحة', moveHistory: 'سجل الحركات', noMoves: 'لم تُلعب أي حركة بعد', lastMove: 'آخر حركة', hintShown: 'تم تمييز الحركة المقترحة على اللوحة.', roundComplete: 'انتهت الجولة', gameInProgress: 'الجولة جارية', pageTitle: 'tic-tac-toe v1.00 — لعبة استراتيجية مجانية', pageDescription: 'العب tic-tac-toe ضد خمسة مستويات من الذكاء الاصطناعي أو صديق. لعبة مجانية بالعربية والإنجليزية مع حفظ التقدم محليًا.',
  modeChangeTitle: 'تبديل وضع اللعب؟', modeChangeConfirm: 'بدء مباراة جديدة في هذا الوضع؟ سيتم مسح اللوحة ونتيجة المواجهة الحالية، مع الاحتفاظ بالإحصائيات الدائمة.', markChangeTitle: 'تغيير علامتك؟', markChangeConfirm: 'تطبيق هذه العلامة وبدء مباراة جديدة؟ سيتم مسح اللوحة ونتيجة المواجهة الحالية.', roundSettingTitle: 'إعادة الجولة؟', roundSettingConfirm: 'تطبيق هذا الإعداد وإعادة الجولة الحالية؟ ستظل نتيجة المواجهة محفوظة.', applyChange: 'تطبيق وإعادة الجولة',
};
export type TranslationKey = keyof typeof en;
export const TRANSLATION_KEYS = Object.keys(en) as TranslationKey[];
export function getTranslator(language: Language) {
  const dictionary = language === 'ar' ? ar : en;
  return (key: TranslationKey): string => dictionary[key] ?? en[key];
}
