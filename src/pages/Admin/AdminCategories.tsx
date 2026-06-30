import './AdminStyles.css';

export function AdminCategories() {
    return (
        <div className="admin-page">
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">Категории</h1>
                    <p className="admin-subtitle">Управление категориями блюд</p>
                </div>
            </div>
            <div className="admin-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📁</div>
                <h3 style={{ margin: '0 0 8px 0', fontWeight: 700 }}>Категории создаются автоматически</h3>
                <p style={{ color: '#888', margin: 0, maxWidth: '500px', marginInline: 'auto' }}>
                    В текущей версии системы категории создаются автоматически на основе поля "Категория", 
                    которое вы указываете при создании или редактировании блюда в разделе "Продукты".
                </p>
            </div>
        </div>
    );
}
