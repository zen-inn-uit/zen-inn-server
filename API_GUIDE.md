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

## 📝 Notes

- **Access Token TTL:** 15 minutes
- **Refresh Token TTL:** 30 days
- **Soft Delete:** Hotel xóa chỉ cập nhật `deletedAt`, không xóa thực
- **Images:** Đưa URLs từ module Assets (S3/MinIO)
- **Pricing:** Lưu ý dùng `Int` (cents), không `Float` để tránh làm tròn

