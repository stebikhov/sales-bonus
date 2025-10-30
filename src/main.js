/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
    // @TODO: Расчет выручки от операции
    const { discount, sale_price, quantity } = purchase;
    return sale_price * quantity * (1 - (discount / 100));
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    // @TODO: Расчет бонуса от позиции в рейтинге
    const { profit } = seller;

    // Последнее место - без бонуса
    if (index === total - 1) return 0;

    // Коэффициенты для топ-мест
    const bonusRate = index === 0 ? 0.15 : index <= 2 ? 0.10 : 0.05;

    return +(profit * bonusRate).toFixed(2);
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    // @TODO: Проверка входных данных
    if (!data) {
        throw new Error('Некорректные входные данные');
    }
    const requiredArrays = ['sellers', 'products', 'purchase_records'];
    for (const key of requiredArrays) {
        const arr = data[key];
        if (!arr || !Array.isArray(arr) || arr.length === 0) {
            throw new Error(`Некорректные входные данные: ${key}`);
        }
    }

    // @TODO: Проверка наличия опций
    if (!options ||
    typeof options.calculateRevenue !== "function" ||
    typeof options.calculateBonus !== "function"
    ) {
        throw new Error("Неверные параметры");
    }

    // @TODO: Подготовка промежуточных данных для сбора статистики
    const sellerStats = data.sellers.map(({ id, first_name, last_name }) => ({
        id,
        name: `${first_name} ${last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {}
    }));

    // @TODO: Индексация продавцов и товаров для быстрого доступа
    const sellerIndex = Object.fromEntries(data.sellers.map(item => [item.id, item]));
    const productIndex = Object.fromEntries(data.products.map(item => [item.sku, item]));
    // Создаём индекс статистики продавцов для быстрого доступа O(1)
    const sellerStatsIndex = Object.fromEntries(sellerStats.map(item => [item.id, item]));
    const { calculateRevenue, calculateBonus } = options;

    // @TODO: Расчет выручки и прибыли для каждого продавца
    data.purchase_records.forEach(record => {
        const seller = sellerIndex[record.seller_id];
        const sellerStat = sellerStatsIndex[seller.id]; // O(1) вместо find O(n)

        if (!sellerStat) return;

        sellerStat.sales_count++;
        sellerStat.revenue += +record.total_amount;

        record.items.forEach(item => {
            const product = productIndex[item.sku];
            const cost = product.purchase_price * item.quantity;
            const rev = calculateRevenue(item);

            sellerStat.profit += rev - cost;
            sellerStat.products_sold[item.sku] = (sellerStat.products_sold[item.sku] || 0) + item.quantity;
        });
    });

    // @TODO: Сортировка продавцов по прибыли
    sellerStats.sort((a, b) => b.profit - a.profit);

    // @TODO: Назначение премий на основе ранжирования
    const sellersLength = sellerStats.length;
    sellerStats.forEach((seller, index) => {
        seller.bonus = calculateBonus(index, sellersLength, seller);

        seller.top_products = Object.entries(seller.products_sold)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([sku, quantity]) => ({ sku, quantity }));
    });

    // @TODO: Подготовка итоговой коллекции с нужными полями
    return sellerStats.map(seller => ({
        seller_id: seller.id,
        name: seller.name,
        revenue: +seller.revenue.toFixed(2),
        profit: +seller.profit.toFixed(2),
        sales_count: seller.sales_count,
        top_products: seller.top_products,
        bonus: +seller.bonus.toFixed(2)
    }));
}
