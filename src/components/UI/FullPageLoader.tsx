import React from 'react';
import { PageSkeleton, type SkeletonVariant } from './Skeleton';
import './FullPageLoader.css';

interface FullPageLoaderProps {
    text?: string;
    /** Page layout to mimic while loading */
    variant?: SkeletonVariant;
}

/** Skeleton page placeholder — replaces classic spinner / "Loading..." */
const FullPageLoader: React.FC<FullPageLoaderProps> = ({ variant = 'generic' }) => {
    return (
        <div className="global-skeleton-wrap">
            <PageSkeleton variant={variant} />
        </div>
    );
};

export default FullPageLoader;
