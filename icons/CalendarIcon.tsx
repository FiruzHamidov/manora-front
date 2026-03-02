import {SVGProps} from 'react';

const CalendarIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="1em"
        height="1em"
        fill="none"
        {...props}
    >
        <g clipPath="url(#a)">
            <path
                stroke="currentColor"
                strokeWidth={1.111}
                d="M1.548 7.11c0-2.2 0-3.3.683-3.983.684-.684 1.784-.684 3.984-.684h2.333c2.2 0 3.3 0 3.983.684.684.683.684 1.783.684 3.983v1.167c0 2.2 0 3.3-.684 3.983-.683.683-1.783.683-3.983.683H6.215c-2.2 0-3.3 0-3.984-.683-.683-.684-.683-1.783-.683-3.983V7.11Z"
            />
            <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth={1.111}
                d="M4.465 2.443v-.875M10.298 2.443v-.875M1.84 5.36h11.083"
            />
            <path
                stroke="currentColor"
                d="M10.881 10.027a.583.583 0 1 1-1.166 0 .583.583 0 0 1 1.166 0ZM10.881 7.693a.583.583 0 1 1-1.166 0 .583.583 0 0 1 1.166 0ZM7.965 10.027a.583.583 0 1 1-1.167 0 .583.583 0 0 1 1.167 0ZM7.965 7.693a.583.583 0 1 1-1.167 0 .583.583 0 0 1 1.167 0ZM5.048 10.027a.583.583 0 1 1-1.167 0 .583.583 0 0 1 1.167 0ZM5.048 7.693a.583.583 0 1 1-1.167 0 .583.583 0 0 1 1.167 0Z"
            />
        </g>
        <defs>
            <clipPath id="a">
                <rect width={14} height={14} x={0.381} y={0.11} fill="currentColor" rx={4}/>
            </clipPath>
        </defs>
    </svg>
);
export default CalendarIcon;
