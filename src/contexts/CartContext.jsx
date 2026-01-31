import { createContext, useContext, useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const CartContext = createContext({})

export const useCart = () => useContext(CartContext)

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(() => {
        try {
            const storedCart = localStorage.getItem('livestock_cart')
            return storedCart ? JSON.parse(storedCart) : []
        } catch (error) {
            console.error('Error parsing cart from storage', error)
            return []
        }
    })

    useEffect(() => {
        localStorage.setItem('livestock_cart', JSON.stringify(cart))
    }, [cart])

    const addToCart = (item) => {
        // Check if item already exists
        const exists = cart.find(i => i.id === item.id)
        if (exists) {
            toast('Item already in cart', { icon: '🛒' })
            return
        }
        setCart(prev => [...prev, item])
        toast.success('Added to cart')
    }

    const removeFromCart = (itemId) => {
        setCart(prev => prev.filter(item => item.id !== itemId))
        toast.success('Removed from cart')
    }

    const clearCart = () => {
        setCart([])
        localStorage.removeItem('livestock_cart')
    }

    const cartTotal = cart.reduce((acc, item) => acc + (parseFloat(item.price) || 0), 0)

    const value = {
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        cartTotal
    }

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    )
}
