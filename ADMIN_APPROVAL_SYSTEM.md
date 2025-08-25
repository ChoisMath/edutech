# Admin Approval System Design

## Overview
This document outlines the admin approval system that allows administrators to review and approve educational cards submitted by users through the "추가요청" (Add Request) feature.

## Features Implemented

### 1. Admin Dashboard Enhancement
- **All Cards View**: Admin interface now shows ALL cards (view=0 and view=1)
- **Status Indicators**: Visual badges showing approval status
  - 🟢 Green "승인됨" badge for approved cards (view=1)
  - 🟡 Orange "대기중" badge for pending cards (view=0)

### 2. Backend API Changes
- **Enhanced `/api/cards` endpoint**: Added `?admin=true` parameter to retrieve all cards
- **Modified card update logic**: Can edit cards regardless of view status
- **View field handling**: Properly processes view status changes in updates

### 3. Edit Modal Integration
- **Approval Status Section**: New radio button controls in edit modal
- **Visual Status Display**: Shows current status with colored badges
- **Seamless Integration**: Works with existing edit workflow

### 4. User Workflow
1. **User Submission**: User submits card via "추가요청" → saved with view=0
2. **Admin Review**: Admin sees all cards with status indicators
3. **Admin Action**: Admin clicks "편집" → can change approval status
4. **Status Change**: Admin selects "승인됨" → view=1 → visible to all users

## Technical Implementation

### Frontend Changes (admin.js)
```javascript
// Fetch all cards for admin
const response = await fetch('/api/cards?admin=true');

// Status indicator in card display
<span class="px-2 py-1 text-xs font-medium rounded-full ${card.view === 1 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
    ${card.view === 1 ? '승인됨' : '대기중'}
</span>

// Handle view status in edit form
const viewStatusRadio = document.querySelector('input[name="editViewStatus"]:checked');
const viewStatus = viewStatusRadio ? parseInt(viewStatusRadio.value) : 1;
cardData.view = viewStatus;
```

### Backend Changes (app.py)
```python
# Admin parameter handling
admin_view = request.args.get('admin', '')
if admin_view == 'true':
    query = supabase.table('edutech_cards').select('*')
else:
    query = supabase.table('edutech_cards').select('*').eq('view', 1)

# View status handling in updates
view_status = data.get('view')
if view_status is not None:
    update_data['view'] = int(view_status)
```

### UI Components (admin.html)
```html
<!-- Approval Status Section in Edit Modal -->
<div class="border-t pt-4">
    <label class="block text-sm font-medium text-gray-700 mb-3">승인 상태</label>
    <div class="space-y-2">
        <label class="flex items-center">
            <input type="radio" name="editViewStatus" value="1" id="editViewApproved">
            <span class="ml-2">승인됨 - 일반 사용자에게 표시</span>
        </label>
        <label class="flex items-center">
            <input type="radio" name="editViewStatus" value="0" id="editViewPending">
            <span class="ml-2">대기중 - 관리자만 볼 수 있음</span>
        </label>
    </div>
</div>
```

## Security Considerations
- Edit password required for all modifications
- Admin password required for deletions
- View status changes logged through existing audit trail

## User Experience Flow
1. **User sees improvement**: Clear visual indication of card status
2. **Admin efficiency**: One-click approval through edit modal
3. **Seamless integration**: No disruption to existing workflows
4. **Immediate feedback**: Status changes reflect immediately after save

## Future Enhancements
- Batch approval functionality
- Email notifications for status changes
- Approval history tracking
- Comment system for rejection reasons