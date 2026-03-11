import axios from 'axios';

const API_KEY = 'MIdqHiwf1HYo6j6bL4WwyZFygHr5yqTZmGVzQzNJ9T8cSBwNC3ujkbyKhcCT';
const API_URL = 'https://vexboost.ru/api/v2';

async function fetchVexboostServices() {
    try {
        const response = await axios.get(`${API_URL}?action=services&key=${API_KEY}`, { timeout: 30000 });
        const allServices = response.data;

        if (!Array.isArray(allServices)) {
            console.error('Invalid response from Vexboost:', response.data);
            return;
        }

        // Filter for VK services only
        const vkServices = allServices.filter(s =>
            s.name.toLowerCase().includes('vk') ||
            s.name.toLowerCase().includes('вк') ||
            s.name.toLowerCase().includes('вконтакте') ||
            s.category.toLowerCase().includes('vk') ||
            s.category.toLowerCase().includes('вк')
        );

        console.log(JSON.stringify(vkServices, null, 2));
    } catch (error: any) {
        console.error('Error fetching services:', error.message);
    }
}

fetchVexboostServices();
