import Link from 'next/link'

export default function Header() {
    return (
        
        <header>
        <div>
        <button href="/home" >
            Home
          </button>           
        <button href="/about" >
            About
        </button>  
        <button href="/Contact" >
            Contact
        </button> 
        </div>
      </header>
    )
  }