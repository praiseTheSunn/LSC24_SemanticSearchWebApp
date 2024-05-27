import React, { useState } from 'react';

const Dropdown = ({ label, displayItems, valueItems, setData }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState(displayItems[0]);

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    const handleItemClick = (value, displayItem) => {
        setData(value);
        setIsOpen(false);
        setCurrentItem(displayItem);
    };

    return (
        <div className="relative inline-block text-left">
            <div>
                <button
                    type="button"
                    className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    id="menu-button"
                    aria-expanded={isOpen}
                    aria-haspopup="true"
                    onClick={toggleDropdown}
                >
                    {currentItem}
                    <svg
                        className="-mr-1 ml-2 h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                    >
                        <path
                            fillRule="evenodd"
                            d="M5.23 7.21a.75.75 0 011.06-.02L10 10.586l3.71-3.707a.75.75 0 111.06 1.06l-4 4a.75.75 0 01-1.06 0l-4-4a.75.75 0 01-.02-1.06z"
                            clipRule="evenodd"
                        />
                    </svg>
                </button>
            </div>

            {isOpen && (
                <div
                    className="origin-top-right absolute right-0 mt-2 w-full rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="menu-button"
                    style={{ zIndex: 9999 }}
                >
                    <div className="py-1" role="none">
                        {displayItems.map((displayItem, index) => (
                            <a
                                href="#"
                                key={index}
                                className="text-gray-700 block px-4 py-2 text-sm"
                                role="menuitem"
                                onClick={() => handleItemClick(valueItems[index], displayItem)}
                            >
                                {displayItem}
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dropdown;
