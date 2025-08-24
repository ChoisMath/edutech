// 전역 변수
let cards = [];
let filteredCards = [];
let searchQuery = '';
let sortable = null;
let isDragModeEnabled = false;

// DOM 요소
const cardsGrid = document.getElementById('cardsGrid');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const addButton = document.getElementById('addButton');
const addModal = document.getElementById('addModal');
const detailModal = document.getElementById('detailModal');
const editModal = document.getElementById('editModal');
const deleteModal = document.getElementById('deleteModal');
const downloadModal = document.getElementById('downloadModal');
const downloadExcelButton = document.getElementById('downloadExcelButton');
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
    
    // 모달 관련
    addButton.addEventListener('click', openAddModal);
    downloadExcelButton.addEventListener('click', openDownloadModal);
    document.getElementById('closeModal').addEventListener('click', closeAddModal);
    document.getElementById('cancelButton').addEventListener('click', closeAddModal);
    document.getElementById('closeDetailModal').addEventListener('click', closeDetailModal);
    document.getElementById('closeEditModal').addEventListener('click', closeEditModal);
    document.getElementById('cancelEditButton').addEventListener('click', closeEditModal);
    document.getElementById('closeDeleteModal').addEventListener('click', closeDeleteModal);
    document.getElementById('cancelDeleteButton').addEventListener('click', closeDeleteModal);
    document.getElementById('closeDownloadModal').addEventListener('click', closeDownloadModal);
    document.getElementById('cancelDownloadButton').addEventListener('click', closeDownloadModal);
    
    // 폼 제출
    document.getElementById('addCardForm').addEventListener('submit', handleAddCard);
    document.getElementById('editCardForm').addEventListener('submit', handleEditCard);
    document.getElementById('confirmDeleteButton').addEventListener('click', handleDeleteCard);
    document.getElementById('confirmDownloadButton').addEventListener('click', handleDownloadExcel);
    
    // 드래그 모드 관련
    dragModeToggle.addEventListener('change', toggleDragMode);
    saveOrderButton.addEventListener('click', handleSaveOrder);
    
    // 모달 외부 클릭시 닫기
    addModal.addEventListener('click', function(e) {
        if (e.target === addModal) closeAddModal();
    });
    
    detailModal.addEventListener('click', function(e) {
        if (e.target === detailModal) closeDetailModal();
    });
    
    editModal.addEventListener('click', function(e) {
        if (e.target === editModal) closeEditModal();
    });
    
    deleteModal.addEventListener('click', function(e) {
        if (e.target === deleteModal) closeDeleteModal();
    });
    
    downloadModal.addEventListener('click', function(e) {
        if (e.target === downloadModal) closeDownloadModal();
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
        destroySortable();
        return;
    }
    
    cardsGrid.classList.remove('hidden');
    emptyState.classList.add('hidden');
    
    cardsGrid.innerHTML = filteredCards.map(card => createCardHTML(card)).join('');
    
    // 검색이 적용되지 않은 상태이고 카드에 sort_order가 있는 경우에만 드래그 앤 드롭 준비
    const hasSortOrder = filteredCards.length > 0 && filteredCards[0].hasOwnProperty('sort_order');
    if (!searchQuery && hasSortOrder) {
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
            ${isDragModeEnabled && !searchQuery && card.hasOwnProperty('sort_order') ? `
                <div class="drag-handle absolute top-2 left-2 opacity-100 transition-opacity duration-200 z-10 cursor-move">
                    <div class="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 shadow-lg" title="드래그하여 순서 변경">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                        </svg>
                    </div>
                </div>
            ` : ''}
            
            <!-- 관리자 기능 버튼 -->
            <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                <div class="flex gap-1">
                    <button 
                        onclick="event.stopPropagation(); openEditModal(${card.id})"
                        class="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 shadow-lg"
                        title="편집"
                    >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                    </button>
                    <button 
                        onclick="event.stopPropagation(); openDeleteModal(${card.id})"
                        class="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
                        title="삭제"
                    >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </button>
                </div>
            </div>
            
            <div class="p-4 cursor-pointer" onclick="openDetailModal(${card.id})">
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

    const detailModalContainer = document.getElementById('detailModal').querySelector('.modal-content');
    
    // 모달 컨테이너를 기준으로 버튼 위치를 잡기 위해 relative 속성 추가
    detailModalContainer.style.position = 'relative';

    // 중복 생성을 막기 위해 기존 버튼 제거
    const existingButtons = detailModalContainer.querySelector('.admin-buttons');
    if (existingButtons) {
        existingButtons.remove();
    }

    // 편집/삭제 버튼 컨테이너 생성 및 추가
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'admin-buttons absolute top-4 right-16 flex gap-2 z-20';
    buttonContainer.innerHTML = `
        <button 
            onclick="event.stopPropagation(); closeDetailModal(); openEditModal(${card.id})"
            class="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 shadow-lg"
            title="편집"
        >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
        </button>
        <button 
            onclick="event.stopPropagation(); closeDetailModal(); openDeleteModal(${card.id})"
            class="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
            title="삭제"
        >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
        </button>
    `;
    detailModalContainer.appendChild(buttonContainer);

    // 상세 내용 설정
    const detailContent = document.getElementById('detailContent');
    detailContent.innerHTML = `
        <div class="space-y-6 pt-8">
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

// 추가 모달 열기
function openAddModal() {
    document.getElementById('addCardForm').reset();
    resetAddThumbnail();
    setupAddThumbnailEvents();
    addModal.classList.remove('hidden');
}

// 편집 모달 열기
function openEditModal(cardId) {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;
    
    document.getElementById('editCardId').value = card.id;
    document.getElementById('editCardUrl').value = card.url || '';
    document.getElementById('editCardName').value = card.webpage_name || '';
    document.getElementById('editCardSummary').value = card.user_summary || '';
    document.getElementById('editCardSubjects').value = Array.isArray(card.useful_subjects) ? card.useful_subjects.join(' ') : '';
    document.getElementById('editCardKeyword').value = Array.isArray(card.keyword) ? card.keyword.join(' ') : '';
    document.getElementById('editCardMeaning').value = card.educational_meaning || '';
    document.getElementById('editPassword').value = '';
    
    // 썸네일 관련 요소 초기화
    resetEditThumbnail();
    
    // 현재 썸네일이 있으면 표시
    if (card.thumbnail_url) {
        showEditCurrentThumbnail(card.thumbnail_url);
    }
    
    // 썸네일 편집 이벤트 설정
    setupEditThumbnailEvents();
    
    editModal.classList.remove('hidden');
}

// 삭제 모달 열기
function openDeleteModal(cardId) {
    document.getElementById('deleteCardId').value = cardId;
    document.getElementById('deletePassword').value = '';
    deleteModal.classList.remove('hidden');
}

// 다운로드 모달 열기
function openDownloadModal() {
    document.getElementById('downloadPassword').value = '';
    downloadModal.classList.remove('hidden');
}

// 모달 닫기 함수들
function closeAddModal() {
    addModal.classList.add('hidden');
}

function closeDetailModal() {
    detailModal.classList.add('hidden');
}

function closeEditModal() {
    editModal.classList.add('hidden');
}

function closeDeleteModal() {
    deleteModal.classList.add('hidden');
}

function closeDownloadModal() {
    downloadModal.classList.add('hidden');
}

// 카드 추가 처리
async function handleAddCard(e) {
    e.preventDefault();
    
    let cardData = {
        url: document.getElementById('cardUrl').value,
        webpage_name: document.getElementById('cardName').value,
        user_summary: document.getElementById('cardSummary').value,
        useful_subjects: document.getElementById('cardSubjects').value.split(' ').map(s => s.trim()).filter(s => s),
        keyword: document.getElementById('cardKeyword').value.split(' ').map(k => k.trim()).filter(k => k),
        educational_meaning: document.getElementById('cardMeaning').value
    };
    
    try {
        // 새로운 썸네일이 업로드된 경우 먼저 업로드
        const fileInput = document.getElementById('addThumbnailFile');
        if (fileInput.files && fileInput.files[0]) {
            const thumbnailUrl = await uploadThumbnail(fileInput.files[0]);
            if (thumbnailUrl) {
                cardData.thumbnail_url = thumbnailUrl;
            }
        }
        
        const response = await fetch('/api/cards', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cardData)
        });
        
        if (response.ok) {
            alert('카드가 성공적으로 추가되었습니다!');
            closeAddModal();
            await fetchCards();
        } else {
            const error = await response.json();
            alert(error.error || '카드 추가에 실패했습니다.');
        }
    } catch (error) {
        console.error('카드 추가 실패:', error);
        alert('카드 추가 중 오류가 발생했습니다.');
    }
}

// 카드 편집 처리
async function handleEditCard(e) {
    e.preventDefault();
    
    const cardId = document.getElementById('editCardId').value;
    const password = document.getElementById('editPassword').value;
    
    let cardData = {
        password: password,
        url: document.getElementById('editCardUrl').value,
        webpage_name: document.getElementById('editCardName').value,
        user_summary: document.getElementById('editCardSummary').value,
        useful_subjects: document.getElementById('editCardSubjects').value.split(' ').map(s => s.trim()).filter(s => s),
        keyword: document.getElementById('editCardKeyword').value.split(' ').map(k => k.trim()).filter(k => k),
        educational_meaning: document.getElementById('editCardMeaning').value
    };
    
    try {
        // 새로운 썸네일이 업로드된 경우 먼저 업로드
        const fileInput = document.getElementById('editThumbnailFile');
        if (fileInput.files && fileInput.files[0]) {
            const thumbnailUrl = await uploadThumbnail(fileInput.files[0]);
            if (thumbnailUrl) {
                cardData.thumbnail_url = thumbnailUrl;
            }
        }
        
        const response = await fetch(`/api/cards/${cardId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cardData)
        });
        
        if (response.ok) {
            alert('카드가 성공적으로 수정되었습니다!');
            closeEditModal();
            await fetchCards();
        } else {
            const error = await response.json();
            alert(error.error || '카드 수정에 실패했습니다.');
        }
    } catch (error) {
        console.error('카드 수정 실패:', error);
        alert('카드 수정 중 오류가 발생했습니다.');
    }
}

// 카드 삭제 처리
async function handleDeleteCard() {
    const cardId = document.getElementById('deleteCardId').value;
    const password = document.getElementById('deletePassword').value;
    
    if (!password) {
        alert('비밀번호를 입력해주세요.');
        return;
    }
    
    try {
        const response = await fetch(`/api/cards/${cardId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: password })
        });
        
        if (response.ok) {
            alert('카드가 성공적으로 삭제되었습니다!');
            closeDeleteModal();
            await fetchCards();
        } else {
            const error = await response.json();
            alert(error.error || '카드 삭제에 실패했습니다.');
        }
    } catch (error) {
        console.error('카드 삭제 실패:', error);
        alert('카드 삭제 중 오류가 발생했습니다.');
    }
}

// Excel 다운로드 처리
async function handleDownloadExcel() {
    const passwordElement = document.getElementById('downloadPassword');
    if (!passwordElement) {
        console.error('비밀번호 입력 요소를 찾을 수 없습니다.');
        alert('페이지 오류가 발생했습니다.');
        return;
    }
    
    const password = passwordElement.value;
    if (!password) {
        alert('비밀번호를 입력해주세요.');
        return;
    }
    
    try {
        console.log('Excel 다운로드 요청 시작...');
        const response = await fetch('/api/download-excel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: password })
        });
        
        console.log('서버 응답:', response.status, response.statusText);
        console.log('응답 헤더:', Object.fromEntries(response.headers.entries()));
        
        if (response.ok) {
            const blob = await response.blob();
            console.log('받은 blob 크기:', blob.size, 'bytes');
            
            if (blob.size === 0) {
                throw new Error('빈 파일이 반환되었습니다.');
            }
            
            if (!window.URL || !window.URL.createObjectURL) {
                throw new Error('브라우저가 파일 다운로드를 지원하지 않습니다.');
            }
            
            const url = window.URL.createObjectURL(blob);
            console.log('생성된 URL:', url);
            
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            
            try {
                const dateStr = new Date().toISOString().slice(0,10);
                a.download = `edutech_cards_${dateStr}.xlsx`;
                console.log('파일명:', a.download);
            } catch (dateError) {
                console.warn('날짜 형식 오류:', dateError);
                a.download = 'edutech_cards.xlsx';
            }
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            console.log('다운로드 완료');
            closeDownloadModal();
            alert('Excel 파일이 다운로드되었습니다!');
        } else {
            let errorMessage = 'Excel 다운로드에 실패했습니다.';
            try {
                const contentType = response.headers.get('Content-Type');
                console.log('오류 응답 Content-Type:', contentType);
                
                if (contentType && contentType.includes('application/json')) {
                    const error = await response.json();
                    console.log('서버 오류:', error);
                    errorMessage = error.error || errorMessage;
                } else {
                    const errorText = await response.text();
                    console.log('서버 오류 텍스트:', errorText);
                }
            } catch (parseError) {
                console.warn('오류 응답 파싱 실패:', parseError);
            }
            alert(errorMessage);
        }
    } catch (error) {
        console.error('Excel 다운로드 실패:', error);
        alert('Excel 다운로드 중 오류가 발생했습니다: ' + error.message);
    }
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
}

// 드래그 모드 비활성화
function disableDragMode() {
    saveOrderButton.disabled = true;
    
    // SortableJS 비활성화
    if (sortable) {
        sortable.option("disabled", true);
    }
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

// 추가 모달 썸네일 이벤트 설정
function setupAddThumbnailEvents() {
    const dropzone = document.getElementById('addThumbnailDropzone');
    const fileInput = document.getElementById('addThumbnailFile');
    
    if (dropzone && fileInput) {
        // 새로운 이벤트 리스너로 교체
        dropzone.replaceWith(dropzone.cloneNode(true));
        fileInput.replaceWith(fileInput.cloneNode(true));
        
        // 업데이트된 요소 다시 가져오기
        const newDropzone = document.getElementById('addThumbnailDropzone');
        const newFileInput = document.getElementById('addThumbnailFile');
        
        // 클릭 이벤트
        newDropzone.addEventListener('click', () => {
            newFileInput.click();
        });
        
        // 파일 변경 이벤트
        newFileInput.addEventListener('change', handleAddThumbnailSelect);
        
        // 드래그 앤 드롭 이벤트
        newDropzone.addEventListener('dragover', handleAddDragOver);
        newDropzone.addEventListener('dragleave', handleAddDragLeave);
        newDropzone.addEventListener('drop', handleAddDrop);
    }
    
    // 이미지 제거 버튼 이벤트
    document.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'addRemoveThumbnail') {
            removeAddThumbnail();
        }
    });
}

// 편집 모달 썸네일 이벤트 설정
function setupEditThumbnailEvents() {
    // 기존 이벤트 리스너 제거 (중복 방지)
    const dropzone = document.getElementById('editThumbnailDropzone');
    const fileInput = document.getElementById('editThumbnailFile');
    
    if (dropzone && fileInput) {
        // 새로운 이벤트 리스너로 교체
        dropzone.replaceWith(dropzone.cloneNode(true));
        fileInput.replaceWith(fileInput.cloneNode(true));
        
        // 업데이트된 요소 다시 가져오기
        const newDropzone = document.getElementById('editThumbnailDropzone');
        const newFileInput = document.getElementById('editThumbnailFile');
        
        // 클릭 이벤트
        newDropzone.addEventListener('click', () => {
            newFileInput.click();
        });
        
        // 파일 변경 이벤트
        newFileInput.addEventListener('change', handleEditThumbnailSelect);
        
        // 드래그 앤 드롭 이벤트
        newDropzone.addEventListener('dragover', handleEditDragOver);
        newDropzone.addEventListener('dragleave', handleEditDragLeave);
        newDropzone.addEventListener('drop', handleEditDrop);
    }
    
    // 이미지 제거 버튼 이벤트 (동적으로 생성되므로 이벤트 위임 사용)
    document.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'editRemoveThumbnail') {
            removeEditThumbnail();
        }
    });
}

// 추가 모달 썸네일 처리 함수들
function handleAddThumbnailSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    // 파일 유효성 검사
    if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.');
        return;
    }

    if (file.size > 1 * 1024 * 1024) { // 1MB
        alert('파일 크기는 1MB 이하여야 합니다.');
        return;
    }

    // 미리보기 표시
    const reader = new FileReader();
    reader.onload = function(e) {
        showAddThumbnailPreview(e.target.result);
    };
    reader.readAsDataURL(file);
}

function handleAddDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    const dropzone = document.getElementById('addThumbnailDropzone');
    dropzone.classList.add('border-blue-500', 'bg-blue-50');
}

function handleAddDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    const dropzone = document.getElementById('addThumbnailDropzone');
    dropzone.classList.remove('border-blue-500', 'bg-blue-50');
}

function handleAddDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    const dropzone = document.getElementById('addThumbnailDropzone');
    dropzone.classList.remove('border-blue-500', 'bg-blue-50');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        const fileInput = document.getElementById('addThumbnailFile');
        fileInput.files = files;
        handleAddThumbnailSelect({ target: fileInput });
    }
}

function showAddThumbnailPreview(src) {
    const preview = document.getElementById('addThumbnailPreview');
    const previewImg = document.getElementById('addThumbnailPreviewImg');
    const dropzone = document.getElementById('addThumbnailDropzone');
    
    previewImg.src = src;
    preview.classList.remove('hidden');
    dropzone.classList.add('hidden');
}

function removeAddThumbnail() {
    const fileInput = document.getElementById('addThumbnailFile');
    const preview = document.getElementById('addThumbnailPreview');
    const dropzone = document.getElementById('addThumbnailDropzone');
    
    fileInput.value = '';
    preview.classList.add('hidden');
    dropzone.classList.remove('hidden');
}

function resetAddThumbnail() {
    const preview = document.getElementById('addThumbnailPreview');
    const dropzone = document.getElementById('addThumbnailDropzone');
    const fileInput = document.getElementById('addThumbnailFile');
    
    preview.classList.add('hidden');
    dropzone.classList.remove('hidden');
    fileInput.value = '';
}

// 편집 모달 썸네일 드래그 앤 드롭 처리
function handleEditDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    const dropzone = document.getElementById('editThumbnailDropzone');
    dropzone.classList.add('border-blue-500', 'bg-blue-50');
}

// 드래그 리브 처리
function handleEditDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    const dropzone = document.getElementById('editThumbnailDropzone');
    dropzone.classList.remove('border-blue-500', 'bg-blue-50');
}

// 드롭 처리
function handleEditDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    const dropzone = document.getElementById('editThumbnailDropzone');
    dropzone.classList.remove('border-blue-500', 'bg-blue-50');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        const fileInput = document.getElementById('editThumbnailFile');
        fileInput.files = files;
        handleEditThumbnailSelect({ target: fileInput });
    }
}

// 파일 선택 처리
function handleEditThumbnailSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    // 파일 유효성 검사
    if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.');
        return;
    }

    if (file.size > 1 * 1024 * 1024) { // 1MB
        alert('파일 크기는 1MB 이하여야 합니다.');
        return;
    }

    // 미리보기 표시
    const reader = new FileReader();
    reader.onload = function(e) {
        showEditThumbnailPreview(e.target.result);
    };
    reader.readAsDataURL(file);
}

// 현재 썸네일 표시
function showEditCurrentThumbnail(thumbnailUrl) {
    const currentThumbnail = document.getElementById('editCurrentThumbnail');
    const currentThumbnailImg = document.getElementById('editCurrentThumbnailImg');
    
    currentThumbnailImg.src = thumbnailUrl;
    currentThumbnail.classList.remove('hidden');
}

// 썸네일 미리보기 표시
function showEditThumbnailPreview(src) {
    const preview = document.getElementById('editThumbnailPreview');
    const previewImg = document.getElementById('editThumbnailPreviewImg');
    const dropzone = document.getElementById('editThumbnailDropzone');
    
    previewImg.src = src;
    preview.classList.remove('hidden');
    dropzone.classList.add('hidden');
}

// 썸네일 제거
function removeEditThumbnail() {
    const fileInput = document.getElementById('editThumbnailFile');
    const preview = document.getElementById('editThumbnailPreview');
    const dropzone = document.getElementById('editThumbnailDropzone');
    
    fileInput.value = '';
    preview.classList.add('hidden');
    dropzone.classList.remove('hidden');
}

// 썸네일 관련 요소 초기화
function resetEditThumbnail() {
    const currentThumbnail = document.getElementById('editCurrentThumbnail');
    const preview = document.getElementById('editThumbnailPreview');
    const dropzone = document.getElementById('editThumbnailDropzone');
    const fileInput = document.getElementById('editThumbnailFile');
    
    currentThumbnail.classList.add('hidden');
    preview.classList.add('hidden');
    dropzone.classList.remove('hidden');
    fileInput.value = '';
}

// 썸네일 업로드 (기존 함수 재사용)
async function uploadThumbnail(file) {
    const formData = new FormData();
    formData.append('thumbnail', file);
    
    try {
        const response = await fetch('/api/upload-thumbnail', {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            const data = await response.json();
            return data.url;
        } else {
            console.error('썸네일 업로드 실패');
            return null;
        }
    } catch (error) {
        console.error('썸네일 업로드 오류:', error);
        return null;
    }
}

// ESC 키로 모달 닫기
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        if (!addModal.classList.contains('hidden')) {
            closeAddModal();
        } else if (!detailModal.classList.contains('hidden')) {
            closeDetailModal();
        } else if (!editModal.classList.contains('hidden')) {
            closeEditModal();
        } else if (!deleteModal.classList.contains('hidden')) {
            closeDeleteModal();
        } else if (!downloadModal.classList.contains('hidden')) {
            closeDownloadModal();
        }
    }
});