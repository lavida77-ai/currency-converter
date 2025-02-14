const CURRENCY_SYMBOLS = {
    'CNY': ["人民币", "￥"],
    'USD': ["美元", "$"],
    'JPY': ["日元", "¥"]
};

// 缓存汇率数据
class ExchangeRateCache {
    constructor() {
        this.cacheKey = 'exchangeRateCache';
        this.expirationKey = 'exchangeRateExpiration';
        this.cacheDuration = 24 * 60 * 60 * 1000; // 24小时的毫秒数
    }

    // 获取缓存的汇率数据
    getCachedRates() {
        const cached = localStorage.getItem(this.cacheKey);
        const expiration = localStorage.getItem(this.expirationKey);
        
        if (!cached || !expiration) {
            return null;
        }

        // 检查是否过期
        if (Date.now() > parseInt(expiration)) {
            this.clearCache();
            return null;
        }

        return JSON.parse(cached);
    }

    // 设置缓存
    setCacheRates(rates) {
        localStorage.setItem(this.cacheKey, JSON.stringify(rates));
        localStorage.setItem(this.expirationKey, Date.now() + this.cacheDuration);
    }

    // 清除缓存
    clearCache() {
        localStorage.removeItem(this.cacheKey);
        localStorage.removeItem(this.expirationKey);
    }
}

const rateCache = new ExchangeRateCache();

async function getExchangeRate(fromCurrency, toCurrency) {
    try {
        // 首先尝试从缓存获取汇率数据
        let rates = rateCache.getCachedRates();
        
        // 如果缓存不存在或已过期，则从API获取新数据
        if (!rates) {
            const response = await fetch(`https://api.exchangerate-api.com/v4/latest/USD`);
            const data = await response.json();
            rates = data.rates;
            // 缓存新获取的汇率数据
            rateCache.setCacheRates(rates);
        }

        // 计算转换汇率
        // 先转换为美元，再转换为目标货币
        const fromRate = rates[fromCurrency];
        const toRate = rates[toCurrency];
        return toRate / fromRate;

    } catch (error) {
        console.error('获取汇率失败:', error);
        alert('获取汇率数据失败，请稍后重试');
        return null;
    }
}

async function convertCurrency() {
    const fromCurrency = document.getElementById('fromCurrency').value;
    const toCurrency = document.getElementById('toCurrency').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const resultDiv = document.getElementById('result');

    if (isNaN(amount) || amount < 0) {
        alert('请输入有效的金额！');
        return;
    }

    // 显示加载状态
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = '正在获取最新汇率...';

    // 获取实时汇率并计算
    const rate = await getExchangeRate(fromCurrency, toCurrency);
    if (rate) {
        const result = amount * rate;
        const finalResult = Math.round(result * 100) / 100;

        // 显示结果
        resultDiv.innerHTML = `${amount} ${CURRENCY_SYMBOLS[fromCurrency][0]} = 
                             ${finalResult} ${CURRENCY_SYMBOLS[toCurrency][0]}
                             <div style="font-size: 14px; color: #666; margin-top: 8px;">
                                 当前汇率: 1 ${CURRENCY_SYMBOLS[fromCurrency][0]} = ${rate} ${CURRENCY_SYMBOLS[toCurrency][0]}
                             </div>`;
    }
} 