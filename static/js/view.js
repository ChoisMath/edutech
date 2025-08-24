// 전역 변수
let cards = [];
let filteredCards = [];
let searchQuery = '';

// DOM 요소
const cardsGrid = document.getElementById('cardsGrid');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const detailModal = document.getElementById('detailModal');
const requestModal = document.getElementById('requestModal');
const requestButton = document.getElementById('requestButton');


// 이벤트 리스너 설정
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    fetchCards();
});

function initializeEventListeners() {
    // 검색
    searchInput.addEventListener('input', handleSearch);

    // 추가요청 모달 관련
    requestButton.addEventListener('click', openRequestModal);
    document.getElementById('closeRequestModal').addEventListener('click', closeRequestModal);
    document.getElementById('cancelRequestButton').addEventListener('click', closeRequestModal);
    document.getElementById('requestCardForm').addEventListener('submit', handleRequestCard);
    
    // 상세 모달 관련
    document.getElementById('closeDetailModal').addEventListener('click', closeDetailModal);
    
    // 모달 외부 클릭시 닫기
    detailModal.addEventListener('click', function(e) {
        if (e.target === detailModal) closeDetailModal();
    });

    requestModal.addEventListener('click', function(e) {
        if (e.target === requestModal) closeRequestModal();
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
        
        cards = Array.isArray(data) ? data.filter(c => c.view !== 0) : [];
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

// 추가 요청 모달 열기
function openRequestModal() {
    document.getElementById('requestCardForm').reset();
    resetRequestThumbnail();
    setupRequestThumbnailEvents();
    requestModal.classList.remove('hidden');
}

// 추가 요청 모달 닫기
function closeRequestModal() {
    requestModal.classList.add('hidden');
}

// 카드 추가 요청 처리
async function handleRequestCard(e) {
    e.preventDefault();
    
    let cardData = {
        url: document.getElementById('requestCardUrl').value,
        webpage_name: document.getElementById('requestCardName').value,
        user_summary: document.getElementById('requestCardSummary').value,
        useful_subjects: document.getElementById('requestCardSubjects').value.split(' ').map(s => s.trim()).filter(s => s),
        keyword: document.getElementById('requestCardKeyword').value.split(' ').map(k => k.trim()).filter(k => k),
        educational_meaning: document.getElementById('requestCardMeaning').value,
        view: 0 // view 값을 0으로 설정
    };
    
    try {
        // 새로운 썸네일이 업로드된 경우 먼저 업로드
        const fileInput = document.getElementById('requestThumbnailFile');
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
            alert('카드가 성공적으로 추가 요청되었습니다! 관리자 승인 후 표시됩니다.');
            closeRequestModal();
            // 이 페이지에서는 새로고침하지 않음 (어차피 보이지 않으므로)
        } else {
            const error = await response.json();
            alert(error.error || '카드 추가 요청에 실패했습니다.');
        }
    } catch (error) {
        console.error('카드 추가 요청 실패:', error);
        alert('카드 추가 요청 중 오류가 발생했습니다.');
    }
}

// 썸네일 업로드
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
            alert('썸네일 업로드에 실패했습니다.');
            return null;
        }
    } catch (error) {
        console.error('썸네일 업로드 오류:', error);
        alert('썸네일 업로드 중 오류가 발생했습니다.');
        return null;
    }
}


// 추가 요청 모달 썸네일 이벤트 설정
function setupRequestThumbnailEvents() {
    const dropzone = document.getElementById('requestThumbnailDropzone');
    const fileInput = document.getElementById('requestThumbnailFile');
    
    if (dropzone && fileInput) {
        dropzone.replaceWith(dropzone.cloneNode(true));
        fileInput.replaceWith(fileInput.cloneNode(true));
        
        const newDropzone = document.getElementById('requestThumbnailDropzone');
        const newFileInput = document.getElementById('requestThumbnailFile');
        
        newDropzone.addEventListener('click', () => newFileInput.click());
        newFileInput.addEventListener('change', handleRequestThumbnailSelect);
        newDropzone.addEventListener('dragover', handleRequestDragOver);
        newDropzone.addEventListener('dragleave', handleRequestDragLeave);
        newDropzone.addEventListener('drop', handleRequestDrop);
    }
    
    document.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'requestRemoveThumbnail') {
            removeRequestThumbnail();
        }
    });
}

function handleRequestThumbnailSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.');
        return;
    }
    if (file.size > 1 * 1024 * 1024) { // 1MB
        alert('파일 크기는 1MB 이하여야 합니다.');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => showRequestThumbnailPreview(e.target.result);
    reader.readAsDataURL(file);
}

function handleRequestDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById('requestThumbnailDropzone').classList.add('border-blue-500', 'bg-blue-50');
}

function handleRequestDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById('requestThumbnailDropzone').classList.remove('border-blue-500', 'bg-blue-50');
}

function handleRequestDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById('requestThumbnailDropzone').classList.remove('border-blue-500', 'bg-blue-50');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        const fileInput = document.getElementById('requestThumbnailFile');
        fileInput.files = files;
        handleRequestThumbnailSelect({ target: fileInput });
    }
}

function showRequestThumbnailPreview(src) {
    document.getElementById('requestThumbnailPreviewImg').src = src;
    document.getElementById('requestThumbnailPreview').classList.remove('hidden');
    document.getElementById('requestThumbnailDropzone').classList.add('hidden');
}

function removeRequestThumbnail() {
    document.getElementById('requestThumbnailFile').value = '';
    document.getElementById('requestThumbnailPreview').classList.add('hidden');
    document.getElementById('requestThumbnailDropzone').classList.remove('hidden');
}

function resetRequestThumbnail() {
    document.getElementById('requestThumbnailPreview').classList.add('hidden');
    document.getElementById('requestThumbnailDropzone').classList.remove('hidden');
    document.getElementById('requestThumbnailFile').value = '';
}


// ESC 키로 모달 닫기
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        if (!detailModal.classList.contains('hidden')) {
            closeDetailModal();
        }
        if (!requestModal.classList.contains('hidden')) {
            closeRequestModal();
        }
    }
});
