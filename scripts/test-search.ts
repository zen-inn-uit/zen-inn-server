import axios from 'axios';

async function testSearch() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 Testing hotel search API...\n');
  
  // Test 1: Search by location (Đà Lạt)
  console.log('Test 1: Search Đà Lạt hotels');
  try {
    const response = await axios.get(`${baseUrl}/hotels/search`, {
      params: {
        location: 'Đà Lạt',
        checkIn: '2026-01-24',
        checkOut: '2026-01-25',
      },
    });
    console.log(`✅ Found ${response.data.items.length} hotels`);
    response.data.items.forEach((hotel: any) => {
      console.log(`  - ${hotel.name} (${hotel.city}) - ${hotel.startingPrice?.toLocaleString() || 'N/A'} VNĐ`);
    });
  } catch (error: any) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  console.log('\nTest 2: Search with price filter (max 1,000,000 VNĐ)');
  try {
    const response = await axios.get(`${baseUrl}/hotels/search`, {
      params: {
        location: 'Đà Lạt',
        checkIn: '2026-01-24',
        checkOut: '2026-01-25',
        maxPrice: 1000000,
      },
    });
    console.log(`✅ Found ${response.data.items.length} hotels under 1M VNĐ`);
    response.data.items.forEach((hotel: any) => {
      console.log(`  - ${hotel.name} - ${hotel.startingPrice?.toLocaleString()} VNĐ`);
    });
  } catch (error: any) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  console.log('\nTest 3: Search with star rating filter (4-5 stars)');
  try {
    const response = await axios.get(`${baseUrl}/hotels/search`, {
      params: {
        location: 'Đà Lạt',
        checkIn: '2026-01-24',
        checkOut: '2026-01-25',
        starRatings: '4,5',
      },
    });
    console.log(`✅ Found ${response.data.items.length} 4-5 star hotels`);
    response.data.items.forEach((hotel: any) => {
      console.log(`  - ${hotel.name} (${hotel.rating} ⭐) - ${hotel.startingPrice?.toLocaleString()} VNĐ`);
    });
  } catch (error: any) {
    console.log(`❌ Error: ${error.message}`);
  }
}

testSearch().catch(console.error);
