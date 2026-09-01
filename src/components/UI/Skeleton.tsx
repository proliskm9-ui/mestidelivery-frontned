import React from 'react';
import './Skeleton.css';

type BoneProps = {
  width?: string | number;
  height?: string | number;
  radius?: string | number;
  className?: string;
  style?: React.CSSProperties;
};

export const Bone: React.FC<BoneProps> = ({
  width = '100%',
  height = 14,
  radius = 10,
  className = '',
  style,
}) => (
  <span
    className={`sk-bone ${className}`}
    style={{
      width,
      height,
      borderRadius: radius,
      ...style,
    }}
    aria-hidden
  />
);

const PcCatalogHeaderBones: React.FC = () => (
  <div className="sk-pc-header sk-pc-header--catalog">
    <div className="sk-pc-header-inner sk-pc-header-inner--catalog">
      <Bone width={168} height={28} radius={8} className="sk-pc-logo" />
      <div className="sk-pc-header-mid">
        <Bone width={360} height={48} radius={100} />
        <Bone width={180} height={48} radius={100} />
      </div>
      <div className="sk-pc-header-actions">
        <Bone width={200} height={48} radius={100} className="sk-pc-order" />
        <Bone width={52} height={48} radius={100} />
        <Bone width={52} height={48} radius={100} />
      </div>
    </div>
  </div>
);

const RestCardBones: React.FC = () => (
  <div className="sk-pc-card">
    <Bone className="sk-pc-card-img" width="100%" height={0} radius={25} />
    <div className="sk-h-card-meta" style={{ marginTop: 8 }}>
      <Bone width="58%" height={16} radius={7} />
      <Bone width={40} height={14} radius={6} />
    </div>
    <Bone width="42%" height={13} radius={6} style={{ marginTop: 6 }} />
  </div>
);

const DishCardBones: React.FC = () => (
  <div className="sk-dish-card">
    <Bone className="sk-dish-photo" width="100%" height={0} radius={25} />
    <Bone width="40%" height={15} radius={6} style={{ marginTop: 9 }} />
    <Bone width="75%" height={13} radius={6} style={{ marginTop: 6 }} />
    <Bone width="45%" height={11} radius={5} style={{ marginTop: 6 }} />
  </div>
);

const MetaRowBones: React.FC = () => (
  <div className="sk-rest-meta">
    <div className="sk-rest-meta-item">
      <Bone width={29} height={29} radius={8} />
      <div>
        <Bone width={36} height={14} radius={6} />
        <Bone width={64} height={10} radius={5} style={{ marginTop: 4 }} />
      </div>
    </div>
    <span className="sk-rest-divider" />
    <div className="sk-rest-meta-item">
      <Bone width={32} height={32} radius={8} />
      <div>
        <Bone width={72} height={14} radius={6} />
        <Bone width={56} height={10} radius={5} style={{ marginTop: 4 }} />
      </div>
    </div>
    <span className="sk-rest-divider" />
    <Bone width={28} height={28} radius={8} />
  </div>
);

const PcSectionHeadBones: React.FC<{ titleWidth?: number }> = ({ titleWidth = 120 }) => (
  <div className="sk-section-head">
    <Bone width={titleWidth} height={22} radius={8} />
    <Bone width={48} height={26} radius={20} />
  </div>
);

const PcCategoryRowBones: React.FC = () => (
  <div className="sk-pc-categories">
    {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
      <div key={i} className="sk-pc-cat-item">
        <Bone width={96} height={96} radius="50%" />
        <Bone width={72} height={12} radius={6} />
      </div>
    ))}
  </div>
);

const PcFilterRowBones: React.FC = () => (
  <div className="sk-pc-filters">
    <Bone width={48} height={48} radius={100} />
    <Bone width={132} height={48} radius={100} />
    <Bone width={118} height={48} radius={100} />
    <Bone width={108} height={48} radius={100} />
    <Bone width={96} height={48} radius={100} />
  </div>
);

const PcCardGridBones: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div className="sk-pc-grid">
    {Array.from({ length: count }).map((_, i) => (
      <RestCardBones key={i} />
    ))}
  </div>
);

/** Menu: mobile layout + separate desktop (header / banners / curations / grid) */
export const SkeletonMenu: React.FC = () => (
  <div className="sk-page sk-menu" role="status" aria-label="Loading">
    {/* ── Mobile ── */}
    <div className="sk-only-mobile">
      <div className="sk-menu-header">
        <div className="sk-menu-header-inner">
          <Bone className="sk-menu-avatar" width={44} height={44} radius="50%" />
          <div className="sk-menu-address">
            <Bone width={72} height={12} radius={6} />
            <Bone width={96} height={10} radius={5} style={{ marginTop: 6 }} />
          </div>
          <Bone className="sk-menu-lang" width={41} height={41} radius="50%" />
          <Bone className="sk-menu-search" width="100%" height={52} radius={16} />
        </div>
      </div>

      <div className="sk-menu-body">
        <Bone className="sk-menu-banner" width="100%" height={140} radius={15} />

        <div className="sk-fast-travel">
          <Bone className="sk-ft-big" width={159} height={159} radius={20} />
          <Bone className="sk-ft-top" width={159} height={64} radius={20} />
          <Bone className="sk-ft-bot" width={159} height={64} radius={20} />
          <Bone className="sk-ft-lab1" width={70} height={10} radius={5} />
          <Bone className="sk-ft-lab2" width={56} height={10} radius={5} />
          <Bone className="sk-ft-lab3" width={56} height={10} radius={5} />
        </div>

        <PcSectionHeadBones titleWidth={110} />
        <div className="sk-h-scroll">
          {[0, 1].map((i) => (
            <div key={i} className="sk-h-card">
              <Bone width={286} height={142} radius={25} />
              <div className="sk-h-card-meta">
                <Bone width="58%" height={14} radius={7} />
                <Bone width={36} height={12} radius={6} />
              </div>
              <Bone width="42%" height={11} radius={6} style={{ marginTop: 8 }} />
            </div>
          ))}
        </div>

        <PcSectionHeadBones titleWidth={130} />
        <div className="sk-h-scroll">
          {[0, 1].map((i) => (
            <div key={i} className="sk-h-card">
              <Bone width={286} height={142} radius={25} />
              <div className="sk-h-card-meta">
                <Bone width="55%" height={14} radius={7} />
                <Bone width={36} height={12} radius={6} />
              </div>
              <Bone width="40%" height={11} radius={6} style={{ marginTop: 8 }} />
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* ── Desktop ── */}
    <div className="sk-only-desktop">
      <PcCatalogHeaderBones />

      <div className="sk-pc-body">
        <div className="sk-pc-promo-row">
          <Bone width={480} height={168} radius={24} />
          <Bone width={480} height={168} radius={24} />
        </div>

        <div className="sk-pc-section">
          <PcSectionHeadBones titleWidth={150} />
          <PcCardGridBones count={4} />
        </div>

        <div className="sk-pc-section">
          <PcSectionHeadBones titleWidth={170} />
          <PcCardGridBones count={4} />
        </div>

        <div className="sk-pc-section sk-pc-section--compact">
          <PcSectionHeadBones titleWidth={150} />
          <PcCategoryRowBones />
        </div>

        <div className="sk-pc-section sk-pc-section--compact">
          <PcFilterRowBones />
        </div>

        <div className="sk-pc-section">
          <PcCardGridBones count={8} />
        </div>
      </div>
    </div>
  </div>
);

/** Restaurant: mobile sheet / desktop main+sidebar */
export const SkeletonRestaurant: React.FC = () => (
  <div className="sk-page sk-restaurant" role="status" aria-label="Loading">
    {/* ── Mobile ── */}
    <div className="sk-only-mobile">
      <div className="sk-rest-header">
        <div className="sk-rest-nav">
          <Bone width={44} height={44} radius="50%" />
          <div className="sk-rest-nav-right">
            <Bone width={44} height={44} radius="50%" />
            <Bone width={44} height={44} radius="50%" />
          </div>
        </div>
        <Bone width="55%" height={28} radius={10} style={{ marginBottom: 25 }} />
        <MetaRowBones />
      </div>

      <div className="sk-rest-menu">
        <div className="sk-rest-cats">
          {[72, 88, 64, 96, 70].map((w, i) => (
            <Bone key={i} width={w} height={18} radius={6} />
          ))}
        </div>
        <div className="sk-dish-grid">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <DishCardBones key={i} />
          ))}
        </div>
      </div>
    </div>

    {/* ── Desktop ── */}
    <div className="sk-only-desktop sk-pc-rest">
      <div className="sk-pc-rest-grid">
        <div className="sk-pc-rest-main">
          <div className="sk-pc-info-card">
            <div className="sk-rest-nav">
              <Bone width={44} height={44} radius="50%" />
              <div className="sk-rest-nav-right">
                <Bone width={44} height={44} radius="50%" />
                <Bone width={44} height={44} radius="50%" />
              </div>
            </div>
            <Bone width="40%" height={26} radius={10} style={{ marginBottom: 16 }} />
            <MetaRowBones />
            <div className="sk-rest-cats sk-pc-info-cats">
              {[72, 88, 64, 96, 70, 80].map((w, i) => (
                <Bone key={i} width={w} height={18} radius={6} />
              ))}
            </div>
          </div>

          <Bone width={140} height={22} radius={8} style={{ marginBottom: 16 }} />
          <div className="sk-pc-dish-grid">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <DishCardBones key={i} />
            ))}
          </div>
        </div>

        <aside className="sk-pc-sidebar">
          <div className="sk-pc-cart">
            <Bone width="35%" height={18} radius={8} />
            <div className="sk-pc-cart-empty">
              <Bone width="55%" height={14} radius={7} />
            </div>
            <Bone width="100%" height={48} radius={100} style={{ marginTop: 'auto' }} />
          </div>
        </aside>
      </div>
    </div>
  </div>
);

/** Favorites / lists: mobile column / desktop multi-col grid */
export const SkeletonList: React.FC = () => (
  <div className="sk-page sk-list" role="status" aria-label="Loading">
    <div className="sk-only-mobile">
      <div className="sk-list-header">
        <Bone width={44} height={44} radius="50%" className="sk-list-back" />
        <Bone width={120} height={18} radius={8} />
      </div>

      <div className="sk-list-segment">
        <Bone width="100%" height={48} radius={16} />
      </div>

      <div className="sk-list-cards">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="sk-v-card">
            <Bone className="sk-v-card-img" width="100%" height={182} radius={25} />
            <div className="sk-h-card-meta" style={{ marginTop: 10 }}>
              <Bone width="50%" height={14} radius={7} />
              <Bone width={36} height={12} radius={6} />
            </div>
            <Bone width="38%" height={11} radius={6} style={{ marginTop: 8 }} />
          </div>
        ))}
      </div>
    </div>

    <div className="sk-only-desktop sk-list-desktop">
      <div className="sk-list-header sk-list-header--desktop">
        <Bone width={48} height={48} radius="50%" className="sk-list-back" />
        <Bone width={140} height={20} radius={8} />
      </div>

      <div className="sk-list-segment sk-list-segment--desktop">
        <Bone width="100%" height={48} radius={40} />
      </div>

      <PcCardGridBones count={8} />
    </div>
  </div>
);

/** Order status page — realistic mirror of OrderStatus */
export const SkeletonOrder: React.FC = () => (
  <div className="sk-page sk-order" role="status" aria-label="Loading">
    <div className="sk-only-mobile">
      <div className="sk-order-top-block">
        <div className="sk-order-header-row">
          <Bone width={44} height={44} radius="50%" />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <Bone width={110} height={18} radius={8} />
            <Bone width={70} height={12} radius={6} />
          </div>
          <div style={{ width: 44 }} />
        </div>
        <div style={{ textAlign: 'center', margin: '20px 0 16px' }}>
          <Bone width="55%" height={26} radius={8} style={{ margin: '0 auto' }} />
        </div>
        <div className="sk-order-steps-mobile">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="sk-order-step-mobile-item">
              <Bone width={48} height={48} radius="50%" />
              <Bone width={44} height={8} radius={4} style={{ marginTop: 8 }} />
            </div>
          ))}
        </div>
      </div>

      <div className="sk-order-bottom-block">
        <Bone width={120} height={14} radius={6} style={{ marginBottom: 10 }} />
        <Bone width="100%" height={100} radius={20} style={{ marginBottom: 20 }} />
        <Bone width={90} height={14} radius={6} style={{ marginBottom: 10 }} />
        <Bone width="100%" height={120} radius={20} style={{ marginBottom: 20 }} />
        <Bone width="100%" height={52} radius={18} />
      </div>
    </div>

    <div className="sk-only-desktop sk-order-desktop">
      <div className="sk-order-top">
        <Bone width={48} height={48} radius="50%" />
        <Bone width={160} height={18} radius={8} style={{ margin: '0 auto' }} />
      </div>
      <Bone width="45%" height={32} radius={10} style={{ margin: '20px 0 24px' }} />
      <div className="sk-order-steps">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="sk-order-step">
            <Bone width={52} height={52} radius="50%" />
            <Bone width={64} height={10} radius={6} style={{ marginTop: 8 }} />
          </div>
        ))}
      </div>
      <Bone width="100%" height={200} radius={28} style={{ marginTop: 24 }} />
    </div>
  </div>
);

export const SkeletonGeneric: React.FC = () => (
  <div className="sk-page sk-generic" role="status" aria-label="Loading">
    <div className="sk-only-mobile">
      <div className="sk-menu-header sk-generic-header">
        <div className="sk-menu-header-inner">
          <Bone className="sk-menu-avatar" width={44} height={44} radius="50%" />
          <div className="sk-menu-address">
            <Bone width={72} height={12} radius={6} />
            <Bone width={96} height={10} radius={5} style={{ marginTop: 6 }} />
          </div>
          <Bone className="sk-menu-lang" width={41} height={41} radius="50%" />
          <Bone className="sk-menu-search" width="100%" height={52} radius={16} />
        </div>
      </div>
      <div className="sk-menu-body">
        <Bone width="100%" height={140} radius={15} />
        <Bone width="40%" height={16} radius={8} style={{ marginTop: 28 }} />
        <Bone width="100%" height={120} radius={20} style={{ marginTop: 16 }} />
        <Bone width="100%" height={120} radius={20} style={{ marginTop: 14 }} />
      </div>
    </div>

    <div className="sk-only-desktop">
      <PcCatalogHeaderBones />
      <div className="sk-pc-body">
        <Bone width="35%" height={24} radius={8} style={{ marginBottom: 20 }} />
        <Bone width="100%" height={160} radius={24} style={{ marginBottom: 16 }} />
        <Bone width="100%" height={120} radius={24} />
      </div>
    </div>
  </div>
);

export type SkeletonVariant = 'menu' | 'restaurant' | 'list' | 'order' | 'generic';

export const PageSkeleton: React.FC<{ variant?: SkeletonVariant }> = ({
  variant = 'generic',
}) => {
  switch (variant) {
    case 'menu':
      return <SkeletonMenu />;
    case 'restaurant':
      return <SkeletonRestaurant />;
    case 'list':
      return <SkeletonList />;
    case 'order':
      return <SkeletonOrder />;
    default:
      return <SkeletonGeneric />;
  }
};

export default PageSkeleton;
