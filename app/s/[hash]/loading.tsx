export default function LoadingSelection() {
    return (
        <div className="min-h-screen bg-[#F5F8FF]">
            <div className="max-w-6xl mx-auto px-4 py-10">
                <div className="animate-pulse bg-white rounded-xl h-20 mb-6 shadow-sm" />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden">
                            <div className="bg-gray-200 aspect-[4/3]" />
                            <div className="p-3 space-y-2">
                                <div className="h-4 bg-gray-200 rounded" />
                                <div className="h-3 bg-gray-200 rounded w-2/3" />
                                <div className="h-8 bg-gray-200 rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}