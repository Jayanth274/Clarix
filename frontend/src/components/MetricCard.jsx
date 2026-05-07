import React from 'react';
import { motion } from 'framer-motion';

const MetricCard = ({ icon: Icon, label, value, unit = '', subtext = '', trend = null }) => {
    return (
        <div className="glass-card p-5">
            <div className="flex items-center gap-3 mb-3 text-gray-400">
                <div className="p-2 bg-gray-800/50 rounded-lg">
                    <Icon className="w-4 h-4 text-purple-400" />
                </div>
                <span className="text-sm font-medium uppercase tracking-wider">{label}</span>
            </div>

            <div className="flex items-end justify-between">
                <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-white">{value}</span>
                    <span className="text-sm text-gray-500 font-medium">{unit}</span>
                </div>

                {trend && (
                    <div className={`text-sm font-medium px-2 py-1 rounded-full ${trend > 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {trend > 0 ? '+' : ''}{trend}%
                    </div>
                )}
            </div>

            {subtext && <p className="text-xs text-gray-500 mt-2">{subtext}</p>}
        </div>
    );
};

export default MetricCard;
