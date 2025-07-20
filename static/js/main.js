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
const editModal = document.getElementById('editModal');
const deleteModal = document.getElementById('deleteModal');

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
    document.getElementById('closeEditModal').addEventListener('click', closeEditModal);
    document.getElementById('cancelEditButton').addEventListener('click', closeEditModal);
    document.getElementById('closeDeleteModal').addEventListener('click', closeDeleteModal);
    document.getElementById('cancelDeleteButton').addEventListener('click', closeDeleteModal);
    
    // 폼 제출
    document.getElementById('addCardForm').addEventListener('submit', handleAddCard);
    document.getElementById('editCardForm').addEventListener('submit', handleEditCard);
    document.getElementById('confirmDeleteButton').addEventListener('click', handleDeleteCard);
    
    // URL 입력시 중복 체크
    document.getElementById('cardUrl').addEventListener('input', handleUrlCheck);
    
    // 썸네일 업로드 관련
    initializeThumbnailUpload();
    initializeEditThumbnailUpload();
    
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
                    <button onclick="fetchCards()" class="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                        다시 시도
                    </button>
                </div>
            `;
        }
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
    cardDiv.className = 'bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer p-3 card-hover fade-in';
    cardDiv.onclick = () => openDetailModal(card);
    
    const displayKeywords = card.ai_keywords?.slice(0, 3) || [];
    
    cardDiv.innerHTML = `
        <div class="flex items-start gap-3 mb-3">
            <div class="flex-shrink-0">
                ${card.thumbnail_url ? 
                    `<img src="${card.thumbnail_url}" alt="${card.webpage_name}" class="w-12 h-12 object-cover rounded-lg">` :
                    `<div class="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center rounded-lg">
                        <span class="text-gray-400 text-xs">No</span>
                    </div>`
                }
            </div>
            <div class="flex-1 min-w-0">
                <h3 class="text-base font-semibold text-gray-800 mb-1 line-clamp-2">
                    ${card.webpage_name}
                </h3>
            </div>
        </div>
        
        <div class="flex flex-wrap gap-1 mb-2">
            ${card.keyword && Array.isArray(card.keyword) ? 
                card.keyword.map(kw => 
                    `<span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">${kw}</span>`
                ).join('') : 
                ''
            }
            ${card.useful_subjects && Array.isArray(card.useful_subjects) ? 
                card.useful_subjects.map(subject => 
                    `<span class="px-2 py-1 bg-pink-100 text-pink-800 text-xs rounded-full">${subject}</span>`
                ).join('') : 
                ''
            }
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

// 썸네일 업로드 초기화
function initializeThumbnailUpload() {
    const thumbnailFile = document.getElementById('thumbnailFile');
    const thumbnailPreview = document.getElementById('thumbnailPreview');
    const uploadArea = document.getElementById('uploadArea');
    const previewImage = document.getElementById('previewImage');
    const removeThumbnail = document.getElementById('removeThumbnail');
    const thumbnailUrl = document.getElementById('thumbnailUrl');
    
    // 파일 선택 시 처리
    thumbnailFile.addEventListener('change', handleThumbnailUpload);
    
    // 이미지 제거 버튼
    removeThumbnail.addEventListener('click', function() {
        resetThumbnailUpload();
    });
    
    // 드래그 앤 드롭 처리
    const dropArea = thumbnailPreview.parentElement;
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    dropArea.addEventListener('drop', handleDrop, false);
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    function highlight(e) {
        dropArea.classList.add('border-blue-500', 'bg-blue-50');
    }
    
    function unhighlight(e) {
        dropArea.classList.remove('border-blue-500', 'bg-blue-50');
    }
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            thumbnailFile.files = files;
            handleThumbnailUpload({ target: { files: files } });
        }
    }
}

// 썸네일 업로드 처리
async function handleThumbnailUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드할 수 있습니다.');
        return;
    }
    
    // 파일 크기 검증 (16MB)
    if (file.size > 16 * 1024 * 1024) {
        alert('파일 크기는 16MB를 초과할 수 없습니다.');
        return;
    }
    
    const formData = new FormData();
    formData.append('thumbnail', file);
    
    try {
        const response = await fetch('/api/upload-thumbnail', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            // 미리보기 표시
            const previewImage = document.getElementById('previewImage');
            const thumbnailPreview = document.getElementById('thumbnailPreview');
            const uploadArea = document.getElementById('uploadArea');
            const thumbnailUrl = document.getElementById('thumbnailUrl');
            
            previewImage.src = result.url;
            thumbnailUrl.value = result.url;
            thumbnailPreview.classList.remove('hidden');
            uploadArea.classList.add('hidden');
        } else {
            alert(result.error || '이미지 업로드에 실패했습니다.');
        }
    } catch (error) {
        console.error('Error uploading thumbnail:', error);
        alert('이미지 업로드에 실패했습니다.');
    }
}

// 썸네일 업로드 초기화
function resetThumbnailUpload() {
    const thumbnailFile = document.getElementById('thumbnailFile');
    const thumbnailPreview = document.getElementById('thumbnailPreview');
    const uploadArea = document.getElementById('uploadArea');
    const thumbnailUrl = document.getElementById('thumbnailUrl');
    
    thumbnailFile.value = '';
    thumbnailUrl.value = '';
    thumbnailPreview.classList.add('hidden');
    uploadArea.classList.remove('hidden');
}

// 추가 모달 열기
function openAddModal() {
    addModal.classList.remove('hidden');
    document.getElementById('addCardForm').reset();
    document.getElementById('duplicateWarning').classList.add('hidden');
    resetThumbnailUpload();
}

// 추가 모달 닫기
function closeAddModal() {
    addModal.classList.add('hidden');
}

// 상세 모달 열기
function openDetailModal(card) {
    // 제목은 이제 상세 내용에서 표시하므로 여기서는 제거
    
    const detailContent = document.getElementById('detailContent');
    detailContent.innerHTML = `
        <div class="space-y-6">
            <!-- 액션 버튼들 -->
            <div class="flex gap-2 justify-end">
                <button onclick="openEditModal(${JSON.stringify(card).replace(/"/g, '&quot;')})" 
                        class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm">
                    편집
                </button>
                <button onclick="openDeleteModal(${card.id})" 
                        class="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm">
                    삭제
                </button>
            </div>

            <!-- 썸네일과 제목을 함께 배치 -->
            <div class="flex items-start gap-3 mb-6">
                ${card.thumbnail_url ? `
                    <div class="flex-shrink-0">
                        <img src="${card.thumbnail_url}" alt="${card.webpage_name}" class="w-16 h-16 object-cover rounded-lg">
                    </div>
                ` : ''}
                <div class="flex-1">
                    <h2 class="text-2xl font-bold text-gray-800">${card.webpage_name}</h2>
                </div>
            </div>
            
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
        const thumbnailUrl = document.getElementById('thumbnailUrl').value;
        console.log('썸네일 URL:', thumbnailUrl); // 디버깅용
        
        const formData = {
            url: document.getElementById('cardUrl').value,
            webpage_name: document.getElementById('cardName').value,
            user_summary: document.getElementById('cardSummary').value,
            useful_subjects: document.getElementById('cardSubjects').value.split(',').map(s => s.trim()).filter(s => s),
            educational_meaning: document.getElementById('cardMeaning').value,
            keyword: document.getElementById('cardKeyword').value.split(',').map(k => k.trim()).filter(k => k),
            thumbnail_url: thumbnailUrl
        };
        
        console.log('전송할 데이터:', formData); // 디버깅용
        
        const response = await fetch('/api/cards', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            const newCard = await response.json();
            console.log('생성된 카드:', newCard); // 디버깅용
            cards.unshift(newCard);
            filterCards();
            closeAddModal();
        } else {
            const error = await response.json();
            console.error('서버 오류:', error); // 디버깅용
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

// 편집 모달 열기
function openEditModal(card) {
    document.getElementById('editCardId').value = card.id;
    document.getElementById('editCardUrl').value = card.url;
    document.getElementById('editCardName').value = card.webpage_name;
    document.getElementById('editCardSummary').value = card.user_summary || '';
    document.getElementById('editCardSubjects').value = card.useful_subjects ? card.useful_subjects.join(', ') : '';
    document.getElementById('editCardKeyword').value = Array.isArray(card.keyword) ? card.keyword.join(', ') : (card.keyword || '');
    document.getElementById('editCardMeaning').value = card.educational_meaning || '';
    
    // 기존 썸네일 설정
    const editThumbnailUrl = document.getElementById('editThumbnailUrl');
    const editThumbnailPreview = document.getElementById('editThumbnailPreview');
    const editUploadArea = document.getElementById('editUploadArea');
    const editPreviewImage = document.getElementById('editPreviewImage');
    
    if (card.thumbnail_url) {
        editThumbnailUrl.value = card.thumbnail_url;
        editPreviewImage.src = card.thumbnail_url;
        editThumbnailPreview.classList.remove('hidden');
        editUploadArea.classList.add('hidden');
    } else {
        resetEditThumbnailUpload();
    }
    
    editModal.classList.remove('hidden');
    closeDetailModal();
}

// 편집 모달 닫기
function closeEditModal() {
    editModal.classList.add('hidden');
}

// 삭제 모달 열기
function openDeleteModal(cardId) {
    document.getElementById('deleteCardId').value = cardId;
    document.getElementById('deletePassword').value = '';
    deleteModal.classList.remove('hidden');
    closeDetailModal();
}

// 삭제 모달 닫기
function closeDeleteModal() {
    deleteModal.classList.add('hidden');
}

// 카드 편집 처리
async function handleEditCard(e) {
    e.preventDefault();
    
    const submitButton = document.getElementById('submitEditButton');
    const originalText = submitButton.textContent;
    
    submitButton.innerHTML = '<span class="spinner"></span> 수정 중...';
    submitButton.disabled = true;
    
    try {
        const cardId = document.getElementById('editCardId').value;
        const formData = {
            url: document.getElementById('editCardUrl').value,
            webpage_name: document.getElementById('editCardName').value,
            user_summary: document.getElementById('editCardSummary').value,
            useful_subjects: document.getElementById('editCardSubjects').value.split(',').map(s => s.trim()).filter(s => s),
            educational_meaning: document.getElementById('editCardMeaning').value,
            keyword: document.getElementById('editCardKeyword').value.split(',').map(k => k.trim()).filter(k => k),
            thumbnail_url: document.getElementById('editThumbnailUrl').value
        };
        
        const response = await fetch(`/api/cards/${cardId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            const updatedCard = await response.json();
            const cardIndex = cards.findIndex(card => card.id == cardId);
            if (cardIndex !== -1) {
                cards[cardIndex] = updatedCard;
                filterCards();
            }
            closeEditModal();
            alert('카드가 성공적으로 수정되었습니다.');
        } else {
            const error = await response.json();
            alert(error.error || '카드 수정에 실패했습니다.');
        }
    } catch (error) {
        console.error('Error editing card:', error);
        alert('카드 수정에 실패했습니다.');
    } finally {
        submitButton.textContent = originalText;
        submitButton.disabled = false;
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
    
    const confirmButton = document.getElementById('confirmDeleteButton');
    const originalText = confirmButton.textContent;
    
    confirmButton.innerHTML = '<span class="spinner"></span> 삭제 중...';
    confirmButton.disabled = true;
    
    try {
        const response = await fetch(`/api/cards/${cardId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ password })
        });
        
        if (response.ok) {
            cards = cards.filter(card => card.id != cardId);
            filterCards();
            closeDeleteModal();
            alert('카드가 성공적으로 삭제되었습니다.');
        } else {
            const error = await response.json();
            alert(error.error || '카드 삭제에 실패했습니다.');
        }
    } catch (error) {
        console.error('Error deleting card:', error);
        alert('카드 삭제에 실패했습니다.');
    } finally {
        confirmButton.textContent = originalText;
        confirmButton.disabled = false;
    }
}

// 편집 썸네일 업로드 초기화
function initializeEditThumbnailUpload() {
    const editThumbnailFile = document.getElementById('editThumbnailFile');
    const editThumbnailPreview = document.getElementById('editThumbnailPreview');
    const editUploadArea = document.getElementById('editUploadArea');
    const editPreviewImage = document.getElementById('editPreviewImage');
    const editRemoveThumbnail = document.getElementById('editRemoveThumbnail');
    const editThumbnailUrl = document.getElementById('editThumbnailUrl');
    
    // 파일 선택 시 처리
    editThumbnailFile.addEventListener('change', handleEditThumbnailUpload);
    
    // 이미지 제거 버튼
    editRemoveThumbnail.addEventListener('click', function() {
        resetEditThumbnailUpload();
    });
    
    // 드래그 앤 드롭 처리
    const editDropArea = editThumbnailPreview.parentElement;
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        editDropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    ['dragenter', 'dragover'].forEach(eventName => {
        editDropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        editDropArea.addEventListener(eventName, unhighlight, false);
    });
    
    editDropArea.addEventListener('drop', handleEditDrop, false);
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    function highlight(e) {
        editDropArea.classList.add('border-blue-500', 'bg-blue-50');
    }
    
    function unhighlight(e) {
        editDropArea.classList.remove('border-blue-500', 'bg-blue-50');
    }
    
    function handleEditDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            editThumbnailFile.files = files;
            handleEditThumbnailUpload({ target: { files: files } });
        }
    }
}

// 편집 썸네일 업로드 처리
async function handleEditThumbnailUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드할 수 있습니다.');
        return;
    }
    
    // 파일 크기 검증 (16MB)
    if (file.size > 16 * 1024 * 1024) {
        alert('파일 크기는 16MB를 초과할 수 없습니다.');
        return;
    }
    
    const formData = new FormData();
    formData.append('thumbnail', file);
    
    try {
        const response = await fetch('/api/upload-thumbnail', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            // 미리보기 표시
            const editPreviewImage = document.getElementById('editPreviewImage');
            const editThumbnailPreview = document.getElementById('editThumbnailPreview');
            const editUploadArea = document.getElementById('editUploadArea');
            const editThumbnailUrl = document.getElementById('editThumbnailUrl');
            
            editPreviewImage.src = result.url;
            editThumbnailUrl.value = result.url;
            editThumbnailPreview.classList.remove('hidden');
            editUploadArea.classList.add('hidden');
        } else {
            alert(result.error || '이미지 업로드에 실패했습니다.');
        }
    } catch (error) {
        console.error('Error uploading thumbnail:', error);
        alert('이미지 업로드에 실패했습니다.');
    }
}

// 편집 썸네일 업로드 초기화
function resetEditThumbnailUpload() {
    const editThumbnailFile = document.getElementById('editThumbnailFile');
    const editThumbnailPreview = document.getElementById('editThumbnailPreview');
    const editUploadArea = document.getElementById('editUploadArea');
    const editThumbnailUrl = document.getElementById('editThumbnailUrl');
    
    editThumbnailFile.value = '';
    editThumbnailUrl.value = '';
    editThumbnailPreview.classList.add('hidden');
    editUploadArea.classList.remove('hidden');
}