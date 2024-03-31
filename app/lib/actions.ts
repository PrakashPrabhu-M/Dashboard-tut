'use server';

import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const customerDataSchema = z.object({
  id: z.string(),
  customerID: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['paid', 'pending']),
  date: z.string(),
});
const createInvoiceDataSchema = customerDataSchema.omit({
  id: true,
  date: true,
});

export async function createInvoice(customerData: FormData) {
  try {
    const { customerID, amount, status } = createInvoiceDataSchema.parse({
      customerID: customerData.get('customerId'),
      amount: customerData.get('amount'),
      status: customerData.get('status'),
    });
    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];
    await sql`INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerID}, ${amountInCents}, ${status}, ${date})`;

    revalidatePath('/dashboard/invoices');
  } catch (error) {
    return {
      message: 'Database Error: Failed to Create Invoice.',
    };
  }
  redirect('/dashboard/invoices');
}

// Use Zod to update the expected types
const UpdateInvoiceSchema = customerDataSchema.omit({ id: true, date: true });

// ...

export async function updateInvoice(id: string, formData: FormData) {
  try {
    const { customerID, amount, status } = UpdateInvoiceSchema.parse({
      customerID: formData.get('customerId'),
      amount: formData.get('amount'),
      status: formData.get('status'),
    });
    
    const amountInCents = amount * 100;
    
    await sql`
    UPDATE invoices
    SET customer_id = ${customerID}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${id}
    `;
    
    revalidatePath('/dashboard/invoices');
  } catch (error) {
    return {
      message: 'Database Error: Failed to Update Invoice.',
    };
  }
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  try {
    await sql`DELETE FROM invoices WHERE id = ${id}`;
    revalidatePath('/dashboard/invoices');
  } catch (error) {
    return {
      message: 'Database Error: Failed to Delete Invoice.',
    };
  }
}
