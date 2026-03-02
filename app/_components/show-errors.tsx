import { toast } from "react-toastify";

export function showValidationToast(messages: string[]) {
    toast.dismiss(); // чтобы не дублировать
    toast.error(
        <div>
            <div className="font-semibold mb-2">Исправьте ошибки:</div>
            <ul className="list-disc ml-5 space-y-1">
                {messages.map((m, i) => (
                    <li key={i}>{m}</li>
                ))}
            </ul>
        </div>,
        { autoClose: 8000 }
    );
}