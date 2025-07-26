// 전역 변수
let cards = [];
let filteredCards = [];
let searchQuery = '';

// DOM 요소
const cardsGrid = document.getElementById('cardsGrid');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const detailModal = document.getElementById('detailModal');

// 이벤트 리스너 설정
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    fetchCards();
});

function initializeEventListeners() {
    // 검색
    searchInput.addEventListener('input', handleSearch);
    
    // 상세 모달 관련
    document.getElementById('closeDetailModal').addEventListener('click', closeDetailModal);
    
    // 모달 외부 클릭시 닫기
    detailModal.addEventListener('click', function(e) {
        if (e.target === detailModal) closeDetailModal();
    });
}

// 카드 데이터 가져오기
async function fetchCards() {
    try {
        console.log('=== 카드 데이터 요청 시작 ===');
        const response = await fetch('/api/cards');
        console.log('응답 상태:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('받은 데이터:', data);
        console.log('카드 수:', Array.isArray(data) ? data.length : 0);
        
        cards = Array.isArray(data) ? data : [];
        filterCards();
    } catch (error) {
        console.error('ERROR: 카드 가져오기 실패:', error);
        cards = [];
        filterCards();
        
        // 사용자에게 오류 알림
        const cardsGrid = document.getElementById('cardsGrid');
        if (cardsGrid) {
            cardsGrid.innerHTML = `
                <div class="col-span-full text-center py-12 bg-red-50 rounded-lg">
                    <p class="text-red-600 text-lg font-medium">카드를 불러오는데 실패했습니다</p>
                    <p class="text-red-500 text-sm mt-2">오류: ${error.message}</p>
                    <button onclick="fetchCards()" class="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                        다시 시도
                    </button>
                </div>
            `;
        }
    }
}

// 검색 처리
function handleSearch() {
    searchQuery = searchInput.value.trim();
    filterCards();
}

// 카드 필터링 (전체 검색: 제목, 요약, 교과목, 키워드 통합)
function filterCards() {
    let filtered = [...cards];
    
    // 전체 검색 (제목, 요약, 교과목, 키워드에서 통합 검색)
    if (searchQuery) {
        const queries = searchQuery.split(' ').map(q => q.trim().toLowerCase()).filter(q => q);
        filtered = filtered.filter(card => {
            const searchText = `${card.webpage_name} ${card.user_summary || ''} ${(card.useful_subjects || []).join(' ')} ${(card.keyword || []).join(' ')}`.toLowerCase();
            return queries.every(query => searchText.includes(query));
        });
    }
    
    filteredCards = filtered;
    renderCards();
}

// 카드 렌더링
function renderCards() {
    if (filteredCards.length === 0) {
        cardsGrid.classList.add('hidden');
        emptyState.classList.remove('hidden');
        return;
    }
    
    cardsGrid.classList.remove('hidden');
    emptyState.classList.add('hidden');
    
    cardsGrid.innerHTML = filteredCards.map(card => createCardHTML(card)).join('');
}

// 카드 HTML 생성 (읽기 전용)
function createCardHTML(card) {
    const thumbnailUrl = card.thumbnail_url || `https://via.placeholder.com/80x60?text=${encodeURIComponent(card.webpage_name)}`;
    const subjects = Array.isArray(card.useful_subjects) ? card.useful_subjects : [];
    const keywords = Array.isArray(card.keyword) ? card.keyword : [];
    
    return `
        <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden cursor-pointer"
             onclick="openDetailModal(${card.id})">
            <div class="p-4">
                <div class="flex items-start gap-3 mb-3">
                    <div class="flex-shrink-0">
                        <img 
                            src="${thumbnailUrl}" 
                            alt="${card.webpage_name}"
                            class="w-16 h-12 object-cover rounded-md"
                            onerror="this.src='https://via.placeholder.com/80x60?text=${encodeURIComponent(card.webpage_name)}'"
                        />
                    </div>
                    <div class="flex-1 min-w-0">
                        <h3 class="font-bold text-lg text-gray-800 mb-2 line-clamp-2">${card.webpage_name}</h3>
                        ${subjects.length > 0 ? `
                            <div class="mb-2">
                                <div class="flex flex-wrap gap-1">
                                    ${subjects.slice(0, 3).map(subject => 
                                        `<span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">${subject}</span>`
                                    ).join('')}
                                    ${subjects.length > 3 ? `<span class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">+${subjects.length - 3}</span>` : ''}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
                <p class="text-gray-600 text-sm mb-3 line-clamp-3">${card.user_summary || '설명이 없습니다.'}</p>
                
                ${keywords.length > 0 ? `
                    <div class="flex flex-wrap gap-1">
                        ${keywords.slice(0, 3).map(keyword => 
                            `<span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">${keyword}</span>`
                        ).join('')}
                        ${keywords.length > 3 ? `<span class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">+${keywords.length - 3}</span>` : ''}
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

// 상세 모달 열기
function openDetailModal(cardId) {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;
    
    const subjects = Array.isArray(card.useful_subjects) ? card.useful_subjects : [];
    const keywords = Array.isArray(card.keyword) ? card.keyword : [];
    const thumbnailUrl = card.thumbnail_url || `https://via.placeholder.com/400x300?text=${encodeURIComponent(card.webpage_name)}`;
    
    document.getElementById('detailContent').innerHTML = `
        <div class="space-y-6">
            <div class="text-center">
                <img 
                    src="${thumbnailUrl}" 
                    alt="${card.webpage_name}"
                    class="mx-auto rounded-lg shadow-md max-w-full h-48 object-cover"
                    onerror="this.src='https://via.placeholder.com/400x300?text=${encodeURIComponent(card.webpage_name)}'"
                />
            </div>
            
            <div>
                <h2 class="text-2xl font-bold text-gray-800 mb-2">${card.webpage_name}</h2>
                <a href="${card.url}" target="_blank" class="text-blue-600 hover:text-blue-800 underline break-all">
                    ${card.url}
                </a>
            </div>
            
            ${card.user_summary ? `
                <div>
                    <h3 class="text-lg font-semibold text-gray-700 mb-2">간단 요약</h3>
                    <p class="text-gray-600 leading-relaxed">${card.user_summary}</p>
                </div>
            ` : ''}
            
            ${subjects.length > 0 ? `
                <div>
                    <h3 class="text-lg font-semibold text-gray-700 mb-2">유용한 교과목</h3>
                    <div class="flex flex-wrap gap-2">
                        ${subjects.map(subject => 
                            `<span class="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">${subject}</span>`
                        ).join('')}
                    </div>
                </div>
            ` : ''}
            
            ${keywords.length > 0 ? `
                <div>
                    <h3 class="text-lg font-semibold text-gray-700 mb-2">키워드</h3>
                    <div class="flex flex-wrap gap-2">
                        ${keywords.map(keyword => 
                            `<span class="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">${keyword}</span>`
                        ).join('')}
                    </div>
                </div>
            ` : ''}
            
            ${card.educational_meaning ? `
                <div>
                    <h3 class="text-lg font-semibold text-gray-700 mb-2">교육적 의미</h3>
                    <p class="text-gray-600 leading-relaxed">${card.educational_meaning}</p>
                </div>
            ` : ''}
            
            ${card.ai_summary ? `
                <div>
                    <h3 class="text-lg font-semibold text-gray-700 mb-2">AI 분석</h3>
                    <p class="text-gray-600 leading-relaxed">${card.ai_summary}</p>
                </div>
            ` : ''}
        </div>
    `;
    
    detailModal.classList.remove('hidden');
}

// 상세 모달 닫기
function closeDetailModal() {
    detailModal.classList.add('hidden');
}

// ESC 키로 모달 닫기
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        if (!detailModal.classList.contains('hidden')) {
            closeDetailModal();
        }
    }
});