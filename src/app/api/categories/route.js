// app/api/categories/route.js
import { NextResponse } from 'next/server';
import { getAllCategories } from '../lib/firebase-service';

export async function GET() {
  try {
    // Get all unique categories from Firebase
    const uniqueCategories = await getAllCategories();
    
    // Return all unique categories
    return NextResponse.json({
      success: true,
      count: uniqueCategories.length,
      categories: uniqueCategories
    });
  } catch (error) {
    console.error('Error retrieving categories:', error);
    return NextResponse.json({
      error: 'Failed to retrieve categories',
      message: error.message
    }, { status: 500 });
  }
}