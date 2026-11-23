/** SVG text avoids inherited line-height shifting digits outside their circular marker. */
export default function StepNumber({value}:{value:number}) {
 return <svg className="step-number" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><text x="16" y="14.5" fontSize="20" fontWeight="500" textAnchor="middle" dominantBaseline="central">{value}</text></svg>;
}
