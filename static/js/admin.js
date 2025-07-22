// 전역 변수
let cards = [];
let filteredCards = [];
let currentFilter = 'all';
let searchQuery = '';
let sortable = null;
let isDragModeEnabled = false;

// DOM 요소
const cardsGrid = document.getElementById('cardsGrid');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const dragModeToggle = document.getElementById('dragModeToggle');
const saveOrderButton = document.getElementById('saveOrderButton');

// 이벤트 리스너 설정
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    fetchCards();
});

function initializeEventListeners() {
    // 검색
    searchInput.addEventListener('input', handleSearch);
    
    // 필터 버튼
    document.getElementById('filterAll').addEventListener('click', () => setFilter('all'));
    document.getElementById('filterSubject').addEventListener('click', () => setFilter('subject'));
    document.getElementById('filterKeyword').addEventListener('click', () => setFilter('keyword'));
    
    // 드래그 모드 관련
    dragModeToggle.addEventListener('change', toggleDragMode);
    saveOrderButton.addEventListener('click', handleSaveOrder);
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

// 필터 설정
function setFilter(filter) {
    currentFilter = filter;
    
    // 필터 버튼 스타일 업데이트
    document.querySelectorAll('[id^="filter"]').forEach(btn => {
        btn.classList.remove('bg-blue-500', 'text-white');
        btn.classList.add('bg-gray-200', 'text-gray-700');
    });
    
    document.getElementById('filter' + filter.charAt(0).toUpperCase() + filter.slice(1)).classList.remove('bg-gray-200', 'text-gray-700');
    document.getElementById('filter' + filter.charAt(0).toUpperCase() + filter.slice(1)).classList.add('bg-blue-500', 'text-white');
    
    filterCards();
}

// 카드 필터링
function filterCards() {
    let filtered = [...cards];
    
    // 검색어 필터링
    if (searchQuery) {
        const queries = searchQuery.split(',').map(q => q.trim().toLowerCase()).filter(q => q);
        filtered = filtered.filter(card => {
            const searchText = `${card.webpage_name} ${card.user_summary || ''} ${(card.useful_subjects || []).join(' ')} ${(card.keyword || []).join(' ')}`.toLowerCase();
            return queries.some(query => searchText.includes(query));
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
        destroySortable();
        return;
    }
    
    cardsGrid.classList.remove('hidden');
    emptyState.classList.add('hidden');
    
    cardsGrid.innerHTML = filteredCards.map(card => createCardHTML(card)).join('');
    
    // 검색/필터가 적용되지 않은 상태이고 카드에 sort_order가 있는 경우에만 드래그 앤 드롭 준비
    const hasSortOrder = filteredCards.length > 0 && filteredCards[0].hasOwnProperty('sort_order');
    if (!searchQuery && currentFilter === 'all' && hasSortOrder) {
        if (!sortable) {
            initializeSortable();
        }
        // 드래그 모드 상태에 따라 활성화/비활성화
        if (sortable) {
            sortable.option("disabled", !isDragModeEnabled);
        }
    } else {
        destroySortable();
    }
}

// 카드 HTML 생성 (관리자 기능 포함)
function createCardHTML(card) {
    const thumbnailUrl = card.thumbnail_url || `https://via.placeholder.com/80x60?text=${encodeURIComponent(card.webpage_name)}`;
    const subjects = Array.isArray(card.useful_subjects) ? card.useful_subjects : [];
    const keywords = Array.isArray(card.keyword) ? card.keyword : [];
    
    return `
        <div class="card-item bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden relative group ${isDragModeEnabled ? 'drag-mode-enabled border-2 border-blue-200' : ''}" data-card-id="${card.id}">
            <!-- 드래그 핸들 -->
            ${isDragModeEnabled && !searchQuery && currentFilter === 'all' && card.hasOwnProperty('sort_order') ? `
                <div class="drag-handle absolute top-2 left-2 opacity-100 transition-opacity duration-200 z-10 cursor-move">
                    <div class="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 shadow-lg" title="드래그하여 순서 변경">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                        </svg>
                    </div>
                </div>
            ` : ''}
            
            <div class="p-4 cursor-pointer">
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

// SortableJS 초기화
function initializeSortable() {
    if (sortable) {
        destroySortable();
    }
    
    sortable = Sortable.create(cardsGrid, {
        animation: 150,
        handle: '.drag-handle',
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        dragClass: 'sortable-drag',
        disabled: true, // 초기에는 비활성화
        onEnd: function(evt) {
            handleCardReorder(evt);
        }
    });
    
    // 드래그 중 스타일 추가
    const style = document.createElement('style');
    style.textContent = `
        .sortable-ghost {
            opacity: 0.4;
        }
        .sortable-chosen {
            transform: scale(1.02);
        }
        .sortable-drag {
            transform: rotate(5deg);
        }
    `;
    if (!document.querySelector('style[data-sortable]')) {
        style.setAttribute('data-sortable', 'true');
        document.head.appendChild(style);
    }
}

// SortableJS 제거
function destroySortable() {
    if (sortable) {
        sortable.destroy();
        sortable = null;
    }
}

// 카드 순서 변경 처리
async function handleCardReorder(evt) {
    // 드래그 모드가 아닐 때는 순서 변경 불가
    if (!isDragModeEnabled) {
        return;
    }
    
    console.log('카드 순서 변경:', evt.oldIndex, '→', evt.newIndex);
}

// 드래그 모드 토글
function toggleDragMode() {
    isDragModeEnabled = dragModeToggle.checked;
    
    if (isDragModeEnabled) {
        enableDragMode();
    } else {
        disableDragMode();
    }
    
    // 카드 재렌더링 (드래그 핸들 표시/숨김을 위해)
    renderCards();
}

// 드래그 모드 활성화
function enableDragMode() {
    saveOrderButton.disabled = false;
    
    // SortableJS 초기화 (아직 없는 경우)
    if (!sortable) {
        initializeSortable();
    } else {
        // 이미 있는 경우 활성화
        sortable.option("disabled", false);
    }
    
    console.log('드래그 모드 활성화');
}

// 드래그 모드 비활성화
function disableDragMode() {
    saveOrderButton.disabled = true;
    
    // SortableJS 비활성화
    if (sortable) {
        sortable.option("disabled", true);
    }
    
    console.log('드래그 모드 비활성화');
}

// 순서 저장 처리
async function handleSaveOrder() {
    if (!isDragModeEnabled) return;
    
    const password = prompt('관리자 비밀번호를 입력하세요:');
    if (!password) return;
    
    try {
        // 현재 카드 순서 수집
        const cardElements = Array.from(cardsGrid.children);
        const cardOrders = cardElements.map((element, index) => ({
            id: parseInt(element.dataset.cardId),
            sort_order: index + 1
        }));
        
        const response = await fetch('/api/cards/reorder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                password: password,
                card_orders: cardOrders
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('카드 순서가 성공적으로 저장되었습니다!');
            
            // 드래그 모드 해제
            dragModeToggle.checked = false;
            toggleDragMode();
            
            // 데이터 새로고침
            await fetchCards();
        } else {
            alert(data.error || '카드 순서 저장에 실패했습니다.');
        }
    } catch (error) {
        console.error('카드 순서 저장 실패:', error);
        alert('카드 순서 저장 중 오류가 발생했습니다.');
    }
}

// ESC 키로 모달 닫기
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        // ESC 키 처리 로직
    }
});