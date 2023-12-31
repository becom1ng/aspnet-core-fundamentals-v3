import { Action, createAction, createReducer, on, props } from '@ngrx/store';
import {
  CustomerState,
  customerSearchCriteria,
  customerStateAdapter,
  initialCustomerState,
} from './customer.store.model';
import { Customer } from '../customer.model';
import { Update } from '@ngrx/entity';

// * Actions
export const searchCustomersAction = createAction(
  '[Customer List] Search Customers',
  props<{ criteria: customerSearchCriteria }>()
);
export const searchCustomersCompleteAction = createAction(
  '[Customer API] Search Customers Completed',
  props<{ result: Customer[] }>()
);
export const addCustomerAction = createAction(
  '[Customer List] Add Customer',
  props<{ item: Customer }>()
);
export const addCustomerCompleteAction = createAction(
  // TODO: Change "completed" to "success", and consider adding failure action
  '[Customer API] Add Customer Completed',
  props<{ result: Customer }>()
);
export const updateCustomerAction = createAction(
  '[Customer Detail] Update Customer',
  props<{ item: Customer }>()
);
export const updateCustomerCompleteAction = createAction(
  '[Customer API] Update Customer Completed',
  props<{ result: Update<Customer> }>()
);

// * Reducers
const rawCustomerReducer = createReducer(
  initialCustomerState,
  on(searchCustomersAction, (state, action) => ({
    ...state,
    searchStatus: 'searching',
    criteria: action.criteria,
  })),
  on(searchCustomersCompleteAction, (state, action) => {
    return customerStateAdapter.setAll(action.result, {
      ...state,
      searchStatus: 'complete',
    });
  }),
  on(addCustomerAction, (state) => ({
    ...state,
    addCustStatus: 'adding',
  })),
  on(addCustomerCompleteAction, (state, action) => {
    return customerStateAdapter.addOne(action.result, {
      ...state,
      addCustStatus: 'complete',
    });
  }),
  on(updateCustomerAction, (state) => ({
    ...state,
    updateCustomerStatus: 'updating',
  })),
  on(updateCustomerCompleteAction, (state, action) => {
    return customerStateAdapter.updateOne(
      {
        id: action.result.id.toString(),
        changes: { ...action.result.changes },
      },
      {
        ...state,
        updateCustomerStatus: 'complete',
      }
    );
  })
);

/** Provide reducer in AOT-compilation happy way */
export function customerReducer(state: CustomerState, action: Action) {
  return rawCustomerReducer(state, action);
}
