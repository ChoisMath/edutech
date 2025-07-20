// 전역 변수
let cards = [];
let filteredCards = [];
let currentFilter = 'all';
let searchQuery = '';

// DOM 요소
const cardsGrid = document.getElementById('cardsGrid');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const addButton = document.getElementById('addButton');
const addModal = document.getElementById('addModal');
const detailModal = document.getElementById('detailModal');

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
    
    // 모달 관련
    addButton.addEventListener('click', openAddModal);
    document.getElementById('closeModal').addEventListener('click', closeAddModal);
    document.getElementById('cancelButton').addEventListener('click', closeAddModal);
    document.getElementById('closeDetailModal').addEventListener('click', closeDetailModal);
    
    // 폼 제출
    document.getElementById('addCardForm').addEventListener('submit', handleAddCard);
    
    // URL 입력시 중복 체크
    document.getElementById('cardUrl').addEventListener('input', handleUrlCheck);
    
    // 모달 외부 클릭시 닫기
    addModal.addEventListener('click', function(e) {
        if (e.target === addModal) closeAddModal();
    });
    
    detailModal.addEventListener('click', function(e) {
        if (e.target === detailModal) closeDetailModal();
    });
}

// 카드 데이터 가져오기
async function fetchCards() {
    try {
        const response = await fetch('/api/cards');
        const data = await response.json();
        cards = Array.isArray(data) ? data : [];
        filterCards();
    } catch (error) {
        console.error('Error fetching cards:', error);
        cards = [];
        filterCards();
    }
}

// 검색 처리
function handleSearch(e) {
    searchQuery = e.target.value;
    filterCards();
}

// 필터 설정
function setFilter(filter) {
    currentFilter = filter;
    
    // 버튼 스타일 업데이트
    document.querySelectorAll('[id^="filter"]').forEach(btn => {
        btn.className = 'px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-gray-200 text-gray-700 hover:bg-gray-300';
    });
    
    document.getElementById(`filter${filter.charAt(0).toUpperCase() + filter.slice(1)}`).className = 
        'px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-blue-500 text-white';
    
    filterCards();
}

// 카드 필터링
function filterCards() {
    if (!Array.isArray(cards)) {
        filteredCards = [];
        renderCards();
        return;
    }

    if (!searchQuery) {
        filteredCards = cards;
    } else {
        filteredCards = cards.filter(card => 
            card.webpage_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            card.ai_keywords?.some(keyword => 
                keyword.toLowerCase().includes(searchQuery.toLowerCase())
            ) ||
            card.useful_subjects?.some(subject => 
                subject.toLowerCase().includes(searchQuery.toLowerCase())
            )
        );
    }
    
    renderCards();
}

// 카드 렌더링
function renderCards() {
    cardsGrid.innerHTML = '';
    
    if (!filteredCards || filteredCards.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    
    filteredCards.forEach(card => {
        const cardElement = createCardElement(card);
        cardsGrid.appendChild(cardElement);
    });
}

// 카드 요소 생성
function createCardElement(card) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer p-4 card-hover fade-in';
    cardDiv.onclick = () => openDetailModal(card);
    
    const displayKeywords = card.ai_keywords?.slice(0, 3) || [];
    
    cardDiv.innerHTML = `
        <div class="relative h-48 mb-4 bg-gray-200 rounded-md overflow-hidden">
            ${card.thumbnail_url ? 
                `<img src="${card.thumbnail_url}" alt="${card.webpage_name}" class="w-full h-full object-cover">` :
                `<div class="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                    <span class="text-gray-500 text-sm">No Image</span>
                </div>`
            }
        </div>
        
        <h3 class="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
            ${card.webpage_name}
        </h3>
        
        <div class="flex flex-wrap gap-1 mb-2">
            ${displayKeywords.map(keyword => 
                `<span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">${keyword}</span>`
            ).join('')}
            ${card.ai_keywords?.length > 3 ? 
                `<span class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">+${card.ai_keywords.length - 3}</span>` : 
                ''
            }
        </div>
        
        <p class="text-gray-600 text-sm line-clamp-2">
            ${card.user_summary || card.ai_summary || '설명이 없습니다.'}
        </p>
    `;
    
    return cardDiv;
}

// 추가 모달 열기
function openAddModal() {
    addModal.classList.remove('hidden');
    document.getElementById('addCardForm').reset();
    document.getElementById('duplicateWarning').classList.add('hidden');
}

// 추가 모달 닫기
function closeAddModal() {
    addModal.classList.add('hidden');
}

// 상세 모달 열기
function openDetailModal(card) {
    document.getElementById('detailTitle').textContent = card.webpage_name;
    
    const detailContent = document.getElementById('detailContent');
    detailContent.innerHTML = `
        <div class="space-y-6">
            ${card.thumbnail_url ? `
                <div class="relative h-64 bg-gray-200 rounded-lg overflow-hidden">
                    <img src="${card.thumbnail_url}" alt="${card.webpage_name}" class="w-full h-full object-cover">
                </div>
            ` : ''}
            
            <div>
                <h3 class="text-lg font-semibold text-gray-800 mb-2">웹사이트 정보</h3>
                <div class="bg-gray-50 p-4 rounded-lg">
                    <p class="text-sm text-gray-600 mb-1">URL</p>
                    <a href="${card.url}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:text-blue-700 break-all">
                        ${card.url}
                    </a>
                </div>
            </div>
            
            ${card.user_summary ? `
                <div>
                    <h3 class="text-lg font-semibold text-gray-800 mb-2">사용자 요약</h3>
                    <div class="bg-blue-50 p-4 rounded-lg">
                        <p class="text-gray-700">${card.user_summary}</p>
                    </div>
                </div>
            ` : ''}
            
            ${card.useful_subjects && card.useful_subjects.length > 0 ? `
                <div>
                    <h3 class="text-lg font-semibold text-gray-800 mb-2">유용한 교과목</h3>
                    <div class="flex flex-wrap gap-2">
                        ${card.useful_subjects.map(subject => 
                            `<span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">${subject}</span>`
                        ).join('')}
                    </div>
                </div>
            ` : ''}
            
            ${card.educational_meaning ? `
                <div>
                    <h3 class="text-lg font-semibold text-gray-800 mb-2">교육적 의미</h3>
                    <div class="bg-purple-50 p-4 rounded-lg">
                        <p class="text-gray-700">${card.educational_meaning}</p>
                    </div>
                </div>
            ` : ''}
            
            ${card.ai_summary ? `
                <div>
                    <h3 class="text-lg font-semibold text-gray-800 mb-2">AI 분석 요약</h3>
                    <div class="bg-yellow-50 p-4 rounded-lg">
                        <p class="text-gray-700">${card.ai_summary}</p>
                    </div>
                </div>
            ` : ''}
            
            ${card.ai_keywords && card.ai_keywords.length > 0 ? `
                <div>
                    <h3 class="text-lg font-semibold text-gray-800 mb-2">AI 분석 키워드</h3>
                    <div class="flex flex-wrap gap-2">
                        ${card.ai_keywords.map(keyword => 
                            `<span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">${keyword}</span>`
                        ).join('')}
                    </div>
                </div>
            ` : ''}
            
            ${card.ai_category ? `
                <div>
                    <h3 class="text-lg font-semibold text-gray-800 mb-2">AI 분석 카테고리</h3>
                    <div class="bg-orange-50 p-4 rounded-lg">
                        <span class="inline-block px-3 py-1 bg-orange-200 text-orange-800 rounded-full text-sm">
                            ${card.ai_category}
                        </span>
                    </div>
                </div>
            ` : ''}
            
            <div class="text-xs text-gray-500 pt-4 border-t">
                <p>생성일: ${new Date(card.created_at).toLocaleDateString('ko-KR')}</p>
                ${card.updated_at !== card.created_at ? `
                    <p>수정일: ${new Date(card.updated_at).toLocaleDateString('ko-KR')}</p>
                ` : ''}
            </div>
        </div>
    `;
    
    detailModal.classList.remove('hidden');
}

// 상세 모달 닫기
function closeDetailModal() {
    detailModal.classList.add('hidden');
}

// URL 중복 체크
async function handleUrlCheck(e) {
    const url = e.target.value;
    if (!url) {
        document.getElementById('duplicateWarning').classList.add('hidden');
        return;
    }
    
    try {
        const response = await fetch('/api/duplicate-check', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url })
        });
        
        const data = await response.json();
        const duplicates = data.duplicates || [];
        
        if (duplicates.length > 0) {
            const duplicateList = document.getElementById('duplicateList');
            duplicateList.innerHTML = duplicates.map(card => 
                `<p class="text-sm text-yellow-700 mt-1">• ${card.webpage_name}</p>`
            ).join('');
            document.getElementById('duplicateWarning').classList.remove('hidden');
        } else {
            document.getElementById('duplicateWarning').classList.add('hidden');
        }
    } catch (error) {
        console.error('Error checking duplicates:', error);
    }
}

// 카드 추가 처리
async function handleAddCard(e) {
    e.preventDefault();
    
    const submitButton = document.getElementById('submitButton');
    const originalText = submitButton.textContent;
    
    // 로딩 상태 설정
    submitButton.innerHTML = '<span class="spinner"></span> 추가 중...';
    submitButton.disabled = true;
    
    try {
        const formData = {
            url: document.getElementById('cardUrl').value,
            webpage_name: document.getElementById('cardName').value,
            user_summary: document.getElementById('cardSummary').value,
            useful_subjects: document.getElementById('cardSubjects').value.split(',').map(s => s.trim()).filter(s => s),
            educational_meaning: document.getElementById('cardMeaning').value
        };
        
        const response = await fetch('/api/cards', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            const newCard = await response.json();
            cards.unshift(newCard);
            filterCards();
            closeAddModal();
        } else {
            const error = await response.json();
            alert(error.error || '카드 추가에 실패했습니다.');
        }
    } catch (error) {
        console.error('Error adding card:', error);
        alert('카드 추가에 실패했습니다.');
    } finally {
        // 로딩 상태 해제
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
}