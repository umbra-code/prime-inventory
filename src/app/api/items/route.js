import { fetchItems } from '@/services/items';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const items = await fetchItems();
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}
