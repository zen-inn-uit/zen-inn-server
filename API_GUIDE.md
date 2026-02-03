# 📚 Hướng dẫn API - Tạo Partner & Hotel

## 📋 Tóm tắt quy trình

```
1. Đăng ký User (Register) → Verify Email → Set Password
2. Login → Lấy Access Token
3. Tạo/Cập nhật Partner (Company info)
4. Admin duyệt KYC của Partner
5. Tạo Hotel
6. Tạo Room, Amenities, Deals, Booking Styles
```

---

## 🔑 1. Đăng ký & Đăng nhập User

### 1.1 Đăng ký (Register)

**POST** `/api/auth/register`

```json
{
  "email": "partner@example.com"
}
```

**Response:**
```json
{
  "message": "OTP sent"
}
```

### 1.2 Xác minh Email

**POST** `/api/auth/verify-email`

```json
{
  "email": "partner@example.com",
  "code": "123456"  // OTP nhận từ email
}
```

**Response:**
```json
{
  "verified": true
}
```

### 1.3 Đặt mật khẩu

**POST** `/api/auth/set-password`

```json
{
  "email": "partner@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "user": {
    "id": "user_123",
    "email": "partner@example.com",
    "role": "CUSTOMER"
  }
}
```

### 1.4 Đăng nhập (Login)

**POST** `/api/auth/login`

```json
{
  "email": "partner@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "user": {
    "id": "user_123",
    "email": "partner@example.com",
    "role": "CUSTOMER"
  }
}
```

**💡 Lưu ý:** Lưu `access_token` để dùng cho các request tiếp theo!

---

## 👥 2. Tạo Partner

### 2.1 Tạo/Cập nhật Partner (Self)

**POST** `/api/partners/me`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Body:**
```json
{
  "company": "ZenInn Hotels Ltd"
}
```

**Response:**
```json
{
  "id": "partner_123",
  "userId": "user_123",
  "company": "ZenInn Hotels Ltd",
  "kycStatus": "PENDING",
  "createdAt": "2025-11-13T10:30:00Z"
}
```

### 2.2 Lấy thông tin Partner của tôi

**GET** `/api/partners/me`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "id": "partner_123",
  "userId": "user_123",
  "company": "ZenInn Hotels Ltd",
  "kycStatus": "PENDING",
  "hotels": [],
  "kycDocuments": []
}
```

### 2.3 Upload KYC Documents

**POST** `/api/partners/me/kyc/docs`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Body:**
```json
{
  "kind": "business_license",
  "url": "https://s3.example.com/docs/license_123.pdf"
}
```

**Response:**
```json
{
  "id": "kycdoc_123",
  "partnerId": "partner_123",
  "kind": "business_license",
  "url": "https://s3.example.com/docs/license_123.pdf",
  "createdAt": "2025-11-13T10:35:00Z"
}
```

### 2.4 Lấy danh sách KYC Documents

**GET** `/api/partners/me/kyc/docs`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
[
  {
    "id": "kycdoc_123",
    "kind": "business_license",
    "url": "https://s3.example.com/docs/license_123.pdf",
    "createdAt": "2025-11-13T10:35:00Z"
  }
]
```

---

## ✅ 3. Admin Duyệt KYC (Chỉ ADMIN)

### 3.1 Xem danh sách Partner chờ duyệt

**GET** `/api/admin/partners?status=PENDING`

**Headers:**
```
Authorization: Bearer {admin_access_token}
```

**Response:**
```json
[
  {
    "id": "partner_123",
    "userId": "user_123",
    "company": "ZenInn Hotels Ltd",
    "kycStatus": "PENDING",
    "kycDocuments": [...]
  }
]
```

### 3.2 Duyệt KYC

**POST** `/api/admin/partners/{partnerId}/approve`

**Headers:**
```
Authorization: Bearer {admin_access_token}
```

**Response:**
```json
{
  "id": "partner_123",
  "kycStatus": "APPROVED"
}
```

### 3.3 Từ chối KYC

**POST** `/api/admin/partners/{partnerId}/reject`

**Headers:**
```
Authorization: Bearer {admin_access_token}
```

**Response:**
```json
{
  "id": "partner_123",
  "kycStatus": "REJECTED"
}
```

---

## 🏨 4. Tạo Hotel

**Tiên quyết:** Partner phải có `kycStatus = APPROVED`

### 4.1 Tạo khách sạn mới

**POST** `/api/partners/hotels`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Body:**
```json
{
  "name": "Zen Inn Downtown",
  "address": "123 Main Street",
  "city": "Ho Chi Minh",
  "country": "Vietnam",
  "starRating": 4,
  "phone": "+84-28-1234-5678",
  "description": "Luxury 4-star hotel in the heart of the city",
  "images": [
    "https://s3.example.com/hotels/hotel1_main.jpg",
    "https://s3.example.com/hotels/hotel1_lobby.jpg",
    "https://s3.example.com/hotels/hotel1_room.jpg"
  ]
}
```

**Response:**
```json
{
  "id": "hotel_123",
  "partnerId": "partner_123",
  "name": "Zen Inn Downtown",
  "address": "123 Main Street",
  "city": "Ho Chi Minh",
  "country": "Vietnam",
  "starRating": 4,
  "phone": "+84-28-1234-5678",
  "description": "Luxury 4-star hotel in the heart of the city",
  "status": "DRAFT",
  "images": [
    {
      "id": "img_1",
      "url": "https://s3.example.com/hotels/hotel1_main.jpg",
      "displayOrder": 0
    },
    {
      "id": "img_2",
      "url": "https://s3.example.com/hotels/hotel1_lobby.jpg",
      "displayOrder": 1
    },
    {
      "id": "img_3",
      "url": "https://s3.example.com/hotels/hotel1_room.jpg",
      "displayOrder": 2
    }
  ],
  "createdAt": "2025-11-13T11:00:00Z",
  "updatedAt": "2025-11-13T11:00:00Z"
}
```

### 4.2 Lấy danh sách khách sạn

**GET** `/api/partners/hotels`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
[
  {
    "id": "hotel_123",
    "name": "Zen Inn Downtown",
    "city": "Ho Chi Minh",
    "starRating": 4,
    "status": "DRAFT",
    ...
  }
]
```

### 4.3 Lấy chi tiết khách sạn

**GET** `/api/partners/hotels/{hotelId}`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "id": "hotel_123",
  "name": "Zen Inn Downtown",
  "address": "123 Main Street",
  "city": "Ho Chi Minh",
  "country": "Vietnam",
  "starRating": 4,
  "status": "DRAFT",
  "images": [...],
  "rooms": []
}
```

### 4.4 Cập nhật khách sạn

**PATCH** `/api/partners/hotels/{hotelId}`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Body:**
```json
{
  "starRating": 5,
  "description": "Updated to 5-star luxury hotel",
  "status": "ACTIVE"
}
```

**Response:**
```json
{
  "id": "hotel_123",
  "starRating": 5,
  "description": "Updated to 5-star luxury hotel",
  "status": "ACTIVE",
  ...
}
```

### 4.5 Xóa khách sạn (Soft Delete)

**DELETE** `/api/partners/hotels/{hotelId}`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "success": true
}
```

---

## 🛏️ 5. Tạo Room (Chưa có endpoint - TODO)

**Schema được định nghĩa sẵn, cần tạo controller/service**

### Structure Room:

```prisma
model Room {
  id              String
  hotelId         String
  
  name            String    // "Deluxe Double Room"
  roomType        String    // loại phòng
  price           Int       // giá/đêm (tính theo cent)
  originalPrice   Int?      // giá gốc nếu có discount
  discountPercent Int?      // % giảm giá
  
  capacity        Int       // số người
  bedCount        Int       // số giường
  area            Float?    // diện tích (feet²/m²)
  
  availableCount  Int       // số phòng còn lại
  totalCount      Int       // tổng số phòng loại này
  
  images          RoomImage[]
  amenities       RoomAmenity[]
  deals           Deal[]
  bookingStyles   RoomBookingStyle[]
}
```

### Example Body (Khi endpoint được tạo):

```json
{
  "name": "Deluxe Double Room",
  "roomType": "Deluxe",
  "price": 12000,      // $120.00
  "originalPrice": 18000,
  "discountPercent": 32,
  "capacity": 2,
  "bedCount": 1,
  "area": 323.0,
  "availableCount": 3,
  "totalCount": 10,
  "images": [
    "https://s3.example.com/rooms/deluxe_1.jpg"
  ]
}
```

---

## 🎯 Complete Example Flow

### Step 1: Đăng ký & Đăng nhập

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "partner@example.com"}'

# Verify Email (Lấy OTP từ email)
curl -X POST http://localhost:3000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"email": "partner@example.com", "code": "123456"}'

# Set Password
curl -X POST http://localhost:3000/api/auth/set-password \
  -H "Content-Type: application/json" \
  -d '{"email": "partner@example.com", "password": "Pass123!"}'

# Lưu access_token từ response
ACCESS_TOKEN="eyJhbGc..."
```

### Step 2: Tạo Partner

```bash
curl -X POST http://localhost:3000/api/partners/me \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"company": "ZenInn Hotels Ltd"}'

# Lưu partnerId từ response
PARTNER_ID="partner_123"
```

### Step 3: Upload KYC

```bash
curl -X POST http://localhost:3000/api/partners/me/kyc/docs \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "business_license",
    "url": "https://s3.example.com/license.pdf"
  }'
```

### Step 4: Admin Duyệt (Từ admin account)

```bash
# Admin login & lấy admin token
ADMIN_TOKEN="admin_eyJhbGc..."

# Duyệt Partner
curl -X POST http://localhost:3000/api/admin/partners/$PARTNER_ID/approve \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Step 5: Tạo Hotel

```bash
curl -X POST http://localhost:3000/api/partners/hotels \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Zen Inn Downtown",
    "address": "123 Main Street",
    "city": "Ho Chi Minh",
    "country": "Vietnam",
    "starRating": 4,
    "phone": "+84-28-1234-5678",
    "description": "Luxury hotel",
    "images": ["https://s3.example.com/hotel.jpg"]
  }'
```

---

---

## 💬 6. Chat với Khách sạn (Hotel Messaging)

### 🎯 User Flow

```
1. User click icon Chat (💬) → Navigate to /messages page
2. Frontend gọi GET /api/chat/conversations → Hiển thị danh sách conversations (giống Messenger inbox)
3. User click vào 1 conversation → Mở chat detail với hotel đó
4. Hoặc user ở hotel detail page → Click "Liên hệ khách sạn" → Tạo/mở conversation với hotel
```

### 6.1 Lấy danh sách cuộc trò chuyện (Messenger Inbox)

**GET** `/api/chat/conversations`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
[
  {
    "id": "conversation_123",
    "userId": "user_123",
    "hotelId": "hotel_123",
    "createdAt": "2025-01-23T10:00:00Z",
    "updatedAt": "2025-01-23T10:30:00Z",
    "unreadCount": 2,
    "hotel": {
      "id": "hotel_123",
      "name": "Zen Inn Downtown",
      "slug": "zen-inn-downtown",
      "city": "Ho Chi Minh",
      "starRating": 4,
      "images": [
        {
          "id": "img_1",
          "url": "https://s3.example.com/hotels/hotel1_main.jpg",
          "displayOrder": 0
        }
      ]
    },
    "lastMessage": {
      "id": "msg_1",
      "content": "Chúng tôi sẽ hỗ trợ bạn ngay",
      "senderId": "partner_user_456",
      "senderType": "HOTEL",
      "createdAt": "2025-01-23T10:30:00Z"
    }
  },
  {
    "id": "conversation_456",
    "userId": "user_123",
    "hotelId": "hotel_456",
    "unreadCount": 0,
    "hotel": {
      "id": "hotel_456",
      "name": "Zen Inn Beach Resort",
      "slug": "zen-inn-beach-resort",
      "city": "Da Nang",
      "starRating": 5,
      "images": [...]
    },
    "lastMessage": {
      "id": "msg_50",
      "content": "Cảm ơn bạn đã liên hệ",
      "senderId": "user_123",
      "senderType": "USER",
      "createdAt": "2025-01-22T15:20:00Z"
    }
  }
]
```

### 6.2 Lấy số tin nhắn chưa đọc (Badge Notification)

**GET** `/api/chat/unread-count`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "unreadCount": 5
}
```

**💡 Sử dụng:** Hiển thị badge số trên icon chat (💬) ở header

### 6.3 Bắt đầu cuộc trò chuyện với khách sạn

**POST** `/api/chat/conversations`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Body:**
```json
{
  "hotelId": "hotel_123"
}
```

**Response:**
```json
{
  "id": "conversation_123",
  "userId": "user_123",
  "hotelId": "hotel_123",
  "createdAt": "2025-01-23T10:00:00Z",
  "updatedAt": "2025-01-23T10:00:00Z",
  "hotel": {
    "id": "hotel_123",
    "name": "Zen Inn Downtown",
    "city": "Ho Chi Minh",
    "images": [
      {
        "id": "img_1",
        "url": "https://s3.example.com/hotels/hotel1_main.jpg",
        "displayOrder": 0
      }
    ]
  },
  "user": {
    "id": "user_123",
    "email": "customer@example.com",
    "fullName": "John Doe"
  },
  "messages": []
}
```

**💡 Sử dụng:** Khi user click button "Liên hệ khách sạn" ở hotel detail page

### 6.4 Đánh dấu đã đọc tin nhắn

**POST** `/api/chat/conversations/{conversationId}/read`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "success": true
}
```

**💡 Sử dụng:** Gọi khi user mở conversation để đánh dấu tất cả tin nhắn từ hotel là đã đọc

### 6.5 Lấy danh sách cuộc trò chuyện (Partner)

**GET** `/api/chat/conversations/partner`

**Headers:**
```
Authorization: Bearer {partner_access_token}
```

**Response:**
```json
[
  {
    "id": "conversation_123",
    "userId": "user_123",
    "hotelId": "hotel_123",
    "createdAt": "2025-01-23T10:00:00Z",
    "updatedAt": "2025-01-23T10:30:00Z",
    "user": {
      "id": "user_123",
      "email": "customer@example.com",
      "fullName": "John Doe"
    },
    "hotel": {
      "id": "hotel_123",
      "name": "Zen Inn Downtown"
    },
    "messages": [...]
  }
]
```

### 6.6 Lấy tin nhắn trong cuộc trò chuyện

**GET** `/api/chat/conversations/{conversationId}/messages`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
[
  {
    "id": "msg_1",
    "conversationId": "conversation_123",
    "senderId": "user_123",
    "senderType": "USER",
    "content": "Hello, I have a question about check-in time",
    "isRead": true,
    "createdAt": "2025-01-23T10:30:00Z"
  },
  {
    "id": "msg_2",
    "conversationId": "conversation_123",
    "senderId": "partner_user_456",
    "senderType": "HOTEL",
    "content": "Hi! Our check-in time is from 2:00 PM",
    "isRead": false,
    "createdAt": "2025-01-23T10:35:00Z"
  }
]
```

### 6.7 WebSocket - Kết nối Real-time Chat

**WebSocket URL:** `ws://localhost:3000` (hoặc `wss://` cho production)

#### Kết nối

```javascript
import { io } from 'socket.io-client';

const socket = io('ws://localhost:3000', {
  auth: {
    token: 'your_access_token_here'
  }
});

// Hoặc truyền qua query
const socket = io('ws://localhost:3000', {
  query: {
    token: 'your_access_token_here'
  }
});
```

#### Join vào conversation room

```javascript
socket.emit('join_conversation', {
  conversationId: 'conversation_123'
});

socket.on('joined_conversation', (conversationId) => {
  console.log('Joined conversation:', conversationId);
});
```

#### Gửi tin nhắn

```javascript
socket.emit('send_message', {
  conversationId: 'conversation_123',
  senderId: 'user_123',
  senderType: 'USER', // hoặc 'HOTEL'
  content: 'Hello, I have a question'
});
```

#### Nhận tin nhắn

```javascript
socket.on('receive_message', (message) => {
  console.log('New message:', message);
  // message = {
  //   id: 'msg_123',
  //   conversationId: 'conversation_123',
  //   senderId: 'user_123',
  //   senderType: 'USER',
  //   content: 'Hello, I have a question',
  //   isRead: false,
  //   createdAt: '2025-01-23T10:30:00Z'
  // }
});
```

#### Ví dụ đầy đủ

```javascript
import { io } from 'socket.io-client';

// 1. Kết nối với authentication
const socket = io('ws://localhost:3000', {
  auth: { token: accessToken }
});

// 2. Lắng nghe sự kiện kết nối
socket.on('connect', () => {
  console.log('Connected to chat server');
  
  // 3. Join vào conversation
  socket.emit('join_conversation', {
    conversationId: 'conversation_123'
  });
});

// 4. Lắng nghe tin nhắn mới
socket.on('receive_message', (message) => {
  // Hiển thị tin nhắn trong UI
  displayMessage(message);
});

// 5. Gửi tin nhắn
function sendMessage(content) {
  socket.emit('send_message', {
    conversationId: 'conversation_123',
    senderId: currentUserId,
    senderType: 'USER',
    content: content
  });
}

// 6. Xử lý ngắt kết nối
socket.on('disconnect', () => {
  console.log('Disconnected from chat server');
});
```

### 6.8 Frontend Implementation Example

#### A. Trang Messages List (Messenger Inbox)

```typescript
// pages/messages/index.tsx

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function MessagesPage() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    const response = await fetch('/api/chat/conversations', {
      headers: {
        'Authorization': `Bearer ${getAccessToken()}`
      }
    });
    const data = await response.json();
    setConversations(data.data);
    setLoading(false);
  };

  return (
    <div className="messages-page">
      <h1>Messages</h1>
      
      {conversations.map(conv => (
        <div 
          key={conv.id} 
          className="conversation-item"
          onClick={() => router.push(`/messages/${conv.id}`)}
        >
          <img src={conv.hotel.images[0]?.url} alt={conv.hotel.name} />
          <div className="info">
            <h3>{conv.hotel.name}</h3>
            <p className={conv.unreadCount > 0 ? 'unread' : ''}>
              {conv.lastMessage?.content || 'No messages yet'}
            </p>
          </div>
          {conv.unreadCount > 0 && (
            <span className="badge">{conv.unreadCount}</span>
          )}
        </div>
      ))}
    </div>
  );
}
```

#### B. Badge Notification trên Header

```typescript
// components/Header.tsx

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Header() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadUnreadCount();
    
    // Poll every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadUnreadCount = async () => {
    const response = await fetch('/api/chat/unread-count', {
      headers: {
        'Authorization': `Bearer ${getAccessToken()}`
      }
    });
    const data = await response.json();
    setUnreadCount(data.data.unreadCount);
  };

  return (
    <header>
      <nav>
        <Link href="/messages" className="chat-icon">
          💬
          {unreadCount > 0 && (
            <span className="badge">{unreadCount}</span>
          )}
        </Link>
        <Link href="/wishlist" className="wishlist-icon">
          ❤️
        </Link>
      </nav>
    </header>
  );
}
```

#### C. Button "Liên hệ khách sạn" ở Hotel Detail

```typescript
// components/ContactHotelButton.tsx

import { useRouter } from 'next/router';

export default function ContactHotelButton({ hotelId }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleContactHotel = async () => {
    setLoading(true);
    
    try {
      // Create or get conversation
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ hotelId })
      });
      
      const data = await response.json();
      
      // Redirect to chat page
      router.push(`/messages/${data.data.id}`);
    } catch (error) {
      console.error('Failed to start conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleContactHotel}
      disabled={loading}
      className="contact-hotel-btn"
    >
      {loading ? 'Loading...' : 'Liên hệ khách sạn'}
    </button>
  );
}
```

---

## 📝 Notes

- **Access Token TTL:** 15 minutes
- **Refresh Token TTL:** 30 days
- **Soft Delete:** Hotel xóa chỉ cập nhật `deletedAt`, không xóa thực
- **Images:** Đưa URLs từ module Assets (S3/MinIO)
- **Pricing:** Lưu ý dùng `Int` (cents), không `Float` để tránh làm tròn
- **WebSocket:** Hỗ trợ real-time messaging giữa customer và hotel
- **Chat:** Mỗi user chỉ có 1 conversation duy nhất với mỗi hotel

