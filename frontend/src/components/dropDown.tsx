import { Button, Menu, MenuItem } from '@mui/material';
import { useState } from 'react';
import type React from 'react';

interface DropdownProps {
  label: string;
  displayItems: string[];
  valueItems: string[];
  setData: (value: string) => void;
}

const Dropdown = ({ label, displayItems, valueItems, setData } : DropdownProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [currentItem, setCurrentItem] = useState<string>(displayItems[0]);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleItemClick = (value: string, displayItem: string) => {
    setData(value);
    setCurrentItem(displayItem);
    handleClose();
  };

  return (
    <div className="relative inline-block text-left">
      <Button
        aria-controls={anchorEl ? 'menu' : undefined}
        aria-haspopup="true"
        onClick={handleClick}
        variant="outlined"
        color="primary"
        sx={{
          textTransform: 'none',
          padding: '8px 16px',
          fontSize: '0.875rem', // Text size equivalent to text-sm
          borderRadius: '4px', // Rounded corners
        }}
      >
        {currentItem}
        <svg
          className="ml-2 h-5 w-5"
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
      </Button>

      <Menu
        id="menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            maxHeight: 300,
            width: '200px',
            zIndex: 9999,
          },
        }}
      >
        {displayItems.map((displayItem, index) => (
          <MenuItem
            key={displayItem}
            onClick={() => handleItemClick(valueItems[index], displayItem)}
            sx={{
              fontSize: '0.875rem', // Text size equivalent to text-sm
            }}
          >
            {displayItem}
          </MenuItem>
        ))}
      </Menu>
    </div>
  );
};

export default Dropdown;
