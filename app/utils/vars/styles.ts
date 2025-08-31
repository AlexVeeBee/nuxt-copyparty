export const baseInputStyleBorderClasses = [
    'border border-gray-200 dark:border-gray-700 oled:border-oled-300',
    'dark:focus:border-primary oled:focus:border-primary',
    'hover:border-primary dark:hover:border-primary oled:hover:border-primary',
]
export const baseInputStyleTextClasses = [
    'text-base text-gray-800',
    'dark:text-white oled:text-white',
    'placeholder:text-gray-500 oled:placeholder:text-gray-400',
]


export const baseInputStyleClasses = [
    baseInputStyleTextClasses,
    baseInputStyleBorderClasses,
    'w-full rounded-md px-6 py-3 outline-none transition-[border-color] duration-300 focus:border-primary',
    'bg-white dark:bg-black oled:bg-oled-200',
    'dark:text-white oled:text-white',
]

export const noPaddingInputStyleClasses = [
    baseInputStyleTextClasses,
    baseInputStyleBorderClasses,
    'w-full rounded-md outline-none transition-[border-color] duration-300 focus:border-primary',
    'bg-white dark:bg-black oled:bg-oled-200',
    'dark:text-white oled:text-white',
]


export const baseInputGlowStyleClasses = [
    'hover:border-primary dark:hover:border-primary oled:hover:border-primary',
    'focus:border-primary dark:focus:border-primary oled:focus:border-primary',
    'focus:ring-2 focus:ring-primary/20 dark:focus:ring-primary/20 oled:focus:ring-primary/20',
    'focus:ring-offset-0 dark:focus:ring-offset-0 oled:focus:ring-offset-0',
    'focus:outline-none dark:focus:outline-none oled:focus:outline-none',
]

export const bigButtonClasses = [
    "bg-white dark:bg-black oled:bg-oled-200 oled:border-oled-300",
	"cursor-pointer relative block group",
	"rounded-lg p-6 transition-[background-color,border,box-shadow] duration-300 ease-in-out",
	"hover:bg-primary/10 dark:hover:bg-primary/10 oled:hover:bg-primary/10",
	"hover:border-primary dark:hover:border-primary oled:hover:border-primary",
	"hover:shadow-lg dark:hover:shadow-primary-800 oled:hover:shadow-primary-800 hover:z-10 dark:hover:z-10 border border-gray-200 dark:border-gray-700"
]