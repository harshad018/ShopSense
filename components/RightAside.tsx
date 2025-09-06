import React from 'react';

interface RightAsideProps {
    prompt: string;
    setPrompt: (prompt: string) => void;
    onGenerate: () => void;
    history: string[];
    onApplyLook: (lookName: string) => void;
    isLoading: boolean;
    disabled: boolean;
    isMobile?: boolean;
    onClose?: () => void;
}

const LookPreview: React.FC<{ name: string, imageUrl: string, onClick: () => void }> = ({ name, imageUrl, onClick }) => (
    <div className="group cursor-pointer" onClick={onClick}>
        <div 
            className="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-xl mb-2 group-hover:scale-105 transition-transform border-2 border-transparent group-hover:border-[var(--primary-color)]"
            style={{backgroundImage: `url("${imageUrl}")`}}
        ></div>
        <p className="text-sm text-center text-gray-300 font-medium">{name}</p>
    </div>
);

export const RightAside: React.FC<RightAsideProps> = ({ prompt, setPrompt, onGenerate, history, onApplyLook, isLoading, disabled, isMobile, onClose }) => {
    
    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            onGenerate();
        }
    };
    
    const asideClasses = isMobile
        ? "w-full h-full p-4 pt-[calc(1rem+var(--safe-area-inset-top))] pb-[calc(1rem+var(--safe-area-inset-bottom))] pl-[calc(1rem+var(--safe-area-inset-left))] pr-[calc(1rem+var(--safe-area-inset-right))] flex flex-col gap-6 bg-[var(--deep-blue)] overflow-y-auto hide-scrollbar"
        : "w-96 p-6 flex flex-col gap-6 panel m-4 overflow-y-auto hide-scrollbar";

    return (
        <aside className={asideClasses}>
             {isMobile && (
                <div className="flex items-center justify-between sticky top-0 bg-[var(--deep-blue)] py-2 z-10">
                    <h2 className="text-xl font-bold text-white">Editing Tools</h2>
                     <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close panel">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
            )}
            {!isMobile && <h2 className="text-xl font-bold text-white">Editing Tools</h2>}
            
            <div>
                <label className="text-sm font-medium text-gray-300" htmlFor="natural-language-input">Natural Language Input (Optional)</label>
                <div className="flex gap-2 mt-1">
                    <input 
                        className="flex-1 form-input w-full min-w-0 resize-none overflow-hidden rounded-full text-white focus:outline-0 focus:ring-2 focus:ring-[var(--primary-color)] border border-[var(--border-color)] bg-gray-700 h-12 placeholder:text-gray-400 p-3 text-base font-normal disabled:opacity-50" 
                        id="natural-language-input" 
                        placeholder="e.g., Move it to the left" 
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isLoading || disabled}
                    />
                    <button 
                        onClick={onGenerate} 
                        disabled={isLoading || disabled}
                        className="btn-primary aspect-square h-12 !rounded-full flex items-center justify-center"
                    >
                        <span className="material-symbols-outlined">send</span>
                    </button>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold text-white mb-2">Looks</h3>
                <div className="grid grid-cols-2 gap-4">
                    <LookPreview name="Golden Hour" imageUrl="https://lh3.googleusercontent.com/aida-public/AB6AXuBsGQoWL9VhMN8HLdJDLpY25SrgCMmxMM-W75LN9vJQUgBQWz6jB0mZGx8bLW_asUSMqHv6fGkdvVc8gpS7Gy8tpEuvOD5pzLsJgHiDHPaDTcJIAfI5zSY_9M3XSrMnFxRN9Kztd1qslGlL1X9rrNOXeOacyiUNmXQZxb_kQQwLA-zG26AHkhwqHKPHpyF0xW2FM4A7u3WmlbzGPBWPSddHNoWM3gVtEE-f5u9Jq9-K39wgUwgo0OfIHwqtIelaK6P2DnOo8pVVKgE" onClick={() => onApplyLook('Golden Hour')} />
                    <LookPreview name="Soft Overcast" imageUrl="https://lh3.googleusercontent.com/aida-public/AB6AXuAKhhMo1Hfwf3SFyVAEf80yhR6jl4obIWj03ubLxh__AflP4gDLFqoDfUsXCug670hml0_5CyRVJNtDRjxCLmG1SYOZ_0KC--PY83RLAb40xVCZeduxehROmC628zW-EualK29LaC-CLmAyygzesQ2tQAYsGZVoNhSMwq4hhmBOZvvthuVvwE-3wVgKxGAX4hyu_GvfFciiEKwJXmc8fq6MPlM4_WtxRYUksx_nRE9PAqqKWmiOpvvuwhjxkK1fM2_WH-a5oy4V6ZM" onClick={() => onApplyLook('Soft Overcast')} />
                    <LookPreview name="Indoor Tungsten" imageUrl="https://lh3.googleusercontent.com/aida-public/AB6AXuD5YVz_V2Jn3b9ptApzUa4VXkOxbTrzvwbOHvID_rnelI8A7X6xQBpfkcaCIB6cGBa__qBC_bcS9QlESgwjf-ZORJsnAatAetIBGtYCjOzKOvXqD_dGYtcQtDAq2wetjTA6boTe8MP7igURPZKnAYeF6OP0QI5Trvad3lDBZNzllWOSk--XqII0jP1zp4UpLN8oKbnoAtooP72H4kxzdaL_bkHQ_B2iDKeRGcXWvk6uo-_J4UZoRNZuaTPN7BJauRVNA7lnLi682Sg" onClick={() => onApplyLook('Indoor Tungsten')} />
                    <LookPreview name="Studio Bright" imageUrl="https://lh3.googleusercontent.com/aida-public/AB6AXuAalm9fRgvbrmmZO7zvQmT03dYbRLP68xmZClHL21C-V7IDwWHJHHzjPZaJn9Fanw0C_8aZRGDhffsv0MokXuMhyxXCxBupPXXR7Fujm3lvFPG1kf8pj0Anf56KsG9k9uVilSedtIVlH6f0S3zFphi8dYbrdy8UWxVlh5BMXeTnnC1d1HsAKPCe_GH78m96QhhCy7DV2Hes4rO7jqZRomljNFSc9O61rWwdHy5vNQvmEZp_jkC2u-YtPiUTH747X7GblJCeqmkQTVU" onClick={() => onApplyLook('Studio Bright')} />
                </div>
            </div>
            
            <div>
                <h3 className="text-lg font-semibold text-white mb-2">History</h3>
                <ul className="space-y-2">
                    {history.length > 0 ? (
                        history.map((action, index) => (
                            <li key={index} className="p-3 bg-gray-700 rounded-lg text-sm text-gray-300 truncate">
                                {action}
                            </li>
                        ))
                    ) : (
                        <li className="p-3 text-center text-sm text-gray-500">Your edits will appear here.</li>
                    )}
                </ul>
            </div>
        </aside>
    );
};