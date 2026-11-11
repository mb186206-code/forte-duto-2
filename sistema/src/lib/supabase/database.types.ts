
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "accounts": {
                  Row: {
                    "active": boolean,"created_at": string,"created_by": string | null,"id": string,"name": string,"notes": string | null,"opening_balance": number,"opening_date": string,"type": Database["public"]['Enums']["account_type"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"created_at"?: string,"created_by"?: string | null,"id"?: string,"name": string,"notes"?: string | null,"opening_balance"?: number,"opening_date"?: string,"type"?: Database["public"]['Enums']["account_type"],"updated_at"?: string
                  }
                  Update: {
                    "active"?: boolean,"created_at"?: string,"created_by"?: string | null,"id"?: string,"name"?: string,"notes"?: string | null,"opening_balance"?: number,"opening_date"?: string,"type"?: Database["public"]['Enums']["account_type"],"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"advertisements": {
                  Row: {
                    "campaign_id": string,"created_at": string,"destination_url": string | null,"external_id": string | null,"format": string | null,"id": string,"name": string,"notes": string | null,"updated_at": string,"utm_content": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "campaign_id": string,"created_at"?: string,"destination_url"?: string | null,"external_id"?: string | null,"format"?: string | null,"id"?: string,"name": string,"notes"?: string | null,"updated_at"?: string,"utm_content"?: string | null
                  }
                  Update: {
                    "campaign_id"?: string,"created_at"?: string,"destination_url"?: string | null,"external_id"?: string | null,"format"?: string | null,"id"?: string,"name"?: string,"notes"?: string | null,"updated_at"?: string,"utm_content"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "advertisements_campaign_id_fkey"
      columns: ["campaign_id"]
isOneToOne: false
      referencedRelation: "campaigns"
      referencedColumns: ["id"]
    }
                  ]
                },"attachments": {
                  Row: {
                    "category": string,"created_at": string,"created_by": string | null,"entity_id": string,"entity_type": string,"file_name": string,"id": string,"mime_type": string | null,"size_bytes": number | null,"storage_path": string
                  }
                  ComputedFields: never
                  Insert: {
                    "category"?: string,"created_at"?: string,"created_by"?: string | null,"entity_id": string,"entity_type": string,"file_name": string,"id"?: string,"mime_type"?: string | null,"size_bytes"?: number | null,"storage_path": string
                  }
                  Update: {
                    "category"?: string,"created_at"?: string,"created_by"?: string | null,"entity_id"?: string,"entity_type"?: string,"file_name"?: string,"id"?: string,"mime_type"?: string | null,"size_bytes"?: number | null,"storage_path"?: string
                  }
                  Relationships: [
                    
                  ]
                },"audit_logs": {
                  Row: {
                    "action": string,"changed_at": string,"changed_by": string | null,"id": number,"new_data": Json | null,"old_data": Json | null,"record_id": string | null,"table_name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"changed_at"?: string,"changed_by"?: string | null,"id"?: never,"new_data"?: Json | null,"old_data"?: Json | null,"record_id"?: string | null,"table_name": string
                  }
                  Update: {
                    "action"?: string,"changed_at"?: string,"changed_by"?: string | null,"id"?: never,"new_data"?: Json | null,"old_data"?: Json | null,"record_id"?: string | null,"table_name"?: string
                  }
                  Relationships: [
                    
                  ]
                },"budget_items": {
                  Row: {
                    "budget_id": string,"created_at": string,"description": string,"id": string,"kind": Database["public"]['Enums']["line_item_kind"],"quantity": number,"sort_order": number,"total": number | null,"unit_price": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "budget_id": string,"created_at"?: string,"description": string,"id"?: string,"kind"?: Database["public"]['Enums']["line_item_kind"],"quantity"?: number,"sort_order"?: number,"total"?: never,"unit_price": number,"updated_at"?: string
                  }
                  Update: {
                    "budget_id"?: string,"created_at"?: string,"description"?: string,"id"?: string,"kind"?: Database["public"]['Enums']["line_item_kind"],"quantity"?: number,"sort_order"?: number,"total"?: never,"unit_price"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "budget_items_budget_id_fkey"
      columns: ["budget_id"]
isOneToOne: false
      referencedRelation: "budget_totals"
      referencedColumns: ["budget_id"]
    },{
      foreignKeyName: "budget_items_budget_id_fkey"
      columns: ["budget_id"]
isOneToOne: false
      referencedRelation: "budgets"
      referencedColumns: ["id"]
    }
                  ]
                },"budgets": {
                  Row: {
                    "address": string | null,"created_at": string,"created_by": string | null,"customer_id": string,"description": string | null,"discount": number,"id": string,"issue_date": string,"notes": string | null,"number": number,"service_id": string | null,"service_type_id": string | null,"status": Database["public"]['Enums']["budget_status"],"updated_at": string,"valid_until": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "address"?: string | null,"created_at"?: string,"created_by"?: string | null,"customer_id": string,"description"?: string | null,"discount"?: number,"id"?: string,"issue_date"?: string,"notes"?: string | null,"number"?: never,"service_id"?: string | null,"service_type_id"?: string | null,"status"?: Database["public"]['Enums']["budget_status"],"updated_at"?: string,"valid_until"?: string | null
                  }
                  Update: {
                    "address"?: string | null,"created_at"?: string,"created_by"?: string | null,"customer_id"?: string,"description"?: string | null,"discount"?: number,"id"?: string,"issue_date"?: string,"notes"?: string | null,"number"?: never,"service_id"?: string | null,"service_type_id"?: string | null,"status"?: Database["public"]['Enums']["budget_status"],"updated_at"?: string,"valid_until"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "budgets_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "budgets_service_fk"
      columns: ["service_id"]
isOneToOne: true
      referencedRelation: "service_costs"
      referencedColumns: ["service_id"]
    },{
      foreignKeyName: "budgets_service_fk"
      columns: ["service_id"]
isOneToOne: true
      referencedRelation: "services"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "budgets_service_type_id_fkey"
      columns: ["service_type_id"]
isOneToOne: false
      referencedRelation: "service_types"
      referencedColumns: ["id"]
    }
                  ]
                },"campaign_metrics": {
                  Row: {
                    "advertisement_id": string | null,"campaign_id": string,"clicks": number,"conversations": number,"created_at": string,"created_by": string | null,"id": string,"impressions": number,"notes": string | null,"period_end": string,"period_start": string,"reach": number,"source": string,"spend": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "advertisement_id"?: string | null,"campaign_id": string,"clicks"?: number,"conversations"?: number,"created_at"?: string,"created_by"?: string | null,"id"?: string,"impressions"?: number,"notes"?: string | null,"period_end": string,"period_start": string,"reach"?: number,"source"?: string,"spend"?: number,"updated_at"?: string
                  }
                  Update: {
                    "advertisement_id"?: string | null,"campaign_id"?: string,"clicks"?: number,"conversations"?: number,"created_at"?: string,"created_by"?: string | null,"id"?: string,"impressions"?: number,"notes"?: string | null,"period_end"?: string,"period_start"?: string,"reach"?: number,"source"?: string,"spend"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "campaign_metrics_advertisement_id_fkey"
      columns: ["advertisement_id"]
isOneToOne: false
      referencedRelation: "advertisements"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "campaign_metrics_campaign_id_fkey"
      columns: ["campaign_id"]
isOneToOne: false
      referencedRelation: "campaigns"
      referencedColumns: ["id"]
    }
                  ]
                },"campaigns": {
                  Row: {
                    "created_at": string,"created_by": string | null,"end_date": string | null,"external_id": string | null,"id": string,"name": string,"notes": string | null,"planned_budget": number | null,"platform": Database["public"]['Enums']["ad_platform"],"service_type_id": string | null,"start_date": string | null,"status": Database["public"]['Enums']["campaign_status"],"updated_at": string,"utm_campaign": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"end_date"?: string | null,"external_id"?: string | null,"id"?: string,"name": string,"notes"?: string | null,"planned_budget"?: number | null,"platform": Database["public"]['Enums']["ad_platform"],"service_type_id"?: string | null,"start_date"?: string | null,"status"?: Database["public"]['Enums']["campaign_status"],"updated_at"?: string,"utm_campaign"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"end_date"?: string | null,"external_id"?: string | null,"id"?: string,"name"?: string,"notes"?: string | null,"planned_budget"?: number | null,"platform"?: Database["public"]['Enums']["ad_platform"],"service_type_id"?: string | null,"start_date"?: string | null,"status"?: Database["public"]['Enums']["campaign_status"],"updated_at"?: string,"utm_campaign"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "campaigns_service_type_id_fkey"
      columns: ["service_type_id"]
isOneToOne: false
      referencedRelation: "service_types"
      referencedColumns: ["id"]
    }
                  ]
                },"company_settings": {
                  Row: {
                    "address": string | null,"company_name": string,"document": string | null,"email": string | null,"id": boolean,"legal_name": string | null,"monthly_profit_goal": number | null,"monthly_revenue_goal": number | null,"phone": string | null,"updated_at": string,"whatsapp": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "address"?: string | null,"company_name"?: string,"document"?: string | null,"email"?: string | null,"id"?: boolean,"legal_name"?: string | null,"monthly_profit_goal"?: number | null,"monthly_revenue_goal"?: number | null,"phone"?: string | null,"updated_at"?: string,"whatsapp"?: string | null
                  }
                  Update: {
                    "address"?: string | null,"company_name"?: string,"document"?: string | null,"email"?: string | null,"id"?: boolean,"legal_name"?: string | null,"monthly_profit_goal"?: number | null,"monthly_revenue_goal"?: number | null,"phone"?: string | null,"updated_at"?: string,"whatsapp"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"customer_attributions": {
                  Row: {
                    "advertisement_id": string | null,"attribution_type": Database["public"]['Enums']["attribution_type"],"campaign_id": string | null,"click_id": string | null,"created_at": string,"created_by": string | null,"customer_id": string,"id": string,"is_primary": boolean,"landing_url": string | null,"notes": string | null,"occurred_at": string,"updated_at": string,"utm_campaign": string | null,"utm_content": string | null,"utm_medium": string | null,"utm_source": string | null,"utm_term": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "advertisement_id"?: string | null,"attribution_type": Database["public"]['Enums']["attribution_type"],"campaign_id"?: string | null,"click_id"?: string | null,"created_at"?: string,"created_by"?: string | null,"customer_id": string,"id"?: string,"is_primary"?: boolean,"landing_url"?: string | null,"notes"?: string | null,"occurred_at"?: string,"updated_at"?: string,"utm_campaign"?: string | null,"utm_content"?: string | null,"utm_medium"?: string | null,"utm_source"?: string | null,"utm_term"?: string | null
                  }
                  Update: {
                    "advertisement_id"?: string | null,"attribution_type"?: Database["public"]['Enums']["attribution_type"],"campaign_id"?: string | null,"click_id"?: string | null,"created_at"?: string,"created_by"?: string | null,"customer_id"?: string,"id"?: string,"is_primary"?: boolean,"landing_url"?: string | null,"notes"?: string | null,"occurred_at"?: string,"updated_at"?: string,"utm_campaign"?: string | null,"utm_content"?: string | null,"utm_medium"?: string | null,"utm_source"?: string | null,"utm_term"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "customer_attributions_advertisement_id_fkey"
      columns: ["advertisement_id"]
isOneToOne: false
      referencedRelation: "advertisements"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "customer_attributions_campaign_id_fkey"
      columns: ["campaign_id"]
isOneToOne: false
      referencedRelation: "campaigns"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "customer_attributions_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["id"]
    }
                  ]
                },"customer_sources": {
                  Row: {
                    "active": boolean,"created_at": string,"id": string,"is_paid_ads": boolean,"name": string,"sort_order": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"created_at"?: string,"id"?: string,"is_paid_ads"?: boolean,"name": string,"sort_order"?: number,"updated_at"?: string
                  }
                  Update: {
                    "active"?: boolean,"created_at"?: string,"id"?: string,"is_paid_ads"?: boolean,"name"?: string,"sort_order"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"customers": {
                  Row: {
                    "address": string | null,"created_at": string,"created_by": string | null,"estimated_value": number | null,"id": string,"name": string,"notes": string | null,"phone": string | null,"phone_digits": string | null,"requested_service": string | null,"source_id": string | null,"status": Database["public"]['Enums']["customer_status"],"updated_at": string,"whatsapp": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "address"?: string | null,"created_at"?: string,"created_by"?: string | null,"estimated_value"?: number | null,"id"?: string,"name": string,"notes"?: string | null,"phone"?: string | null,"phone_digits"?: never,"requested_service"?: string | null,"source_id"?: string | null,"status"?: Database["public"]['Enums']["customer_status"],"updated_at"?: string,"whatsapp"?: string | null
                  }
                  Update: {
                    "address"?: string | null,"created_at"?: string,"created_by"?: string | null,"estimated_value"?: number | null,"id"?: string,"name"?: string,"notes"?: string | null,"phone"?: string | null,"phone_digits"?: never,"requested_service"?: string | null,"source_id"?: string | null,"status"?: Database["public"]['Enums']["customer_status"],"updated_at"?: string,"whatsapp"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "customers_source_id_fkey"
      columns: ["source_id"]
isOneToOne: false
      referencedRelation: "customer_sources"
      referencedColumns: ["id"]
    }
                  ]
                },"expense_categories": {
                  Row: {
                    "active": boolean,"classification": Database["public"]['Enums']["expense_class"],"created_at": string,"id": string,"name": string,"sort_order": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"classification"?: Database["public"]['Enums']["expense_class"],"created_at"?: string,"id"?: string,"name": string,"sort_order"?: number,"updated_at"?: string
                  }
                  Update: {
                    "active"?: boolean,"classification"?: Database["public"]['Enums']["expense_class"],"created_at"?: string,"id"?: string,"name"?: string,"sort_order"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"fund_movements": {
                  Row: {
                    "amount": number,"created_at": string,"created_by": string | null,"fund_id": string,"id": string,"kind": Database["public"]['Enums']["fund_movement_kind"],"movement_date": string,"notes": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount": number,"created_at"?: string,"created_by"?: string | null,"fund_id": string,"id"?: string,"kind": Database["public"]['Enums']["fund_movement_kind"],"movement_date"?: string,"notes"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "amount"?: number,"created_at"?: string,"created_by"?: string | null,"fund_id"?: string,"id"?: string,"kind"?: Database["public"]['Enums']["fund_movement_kind"],"movement_date"?: string,"notes"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "fund_movements_fund_id_fkey"
      columns: ["fund_id"]
isOneToOne: false
      referencedRelation: "fund_balances"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "fund_movements_fund_id_fkey"
      columns: ["fund_id"]
isOneToOne: false
      referencedRelation: "funds"
      referencedColumns: ["id"]
    }
                  ]
                },"funds": {
                  Row: {
                    "account_id": string | null,"active": boolean,"created_at": string,"created_by": string | null,"description": string | null,"id": string,"name": string,"notes": string | null,"target_amount": number | null,"target_date": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "account_id"?: string | null,"active"?: boolean,"created_at"?: string,"created_by"?: string | null,"description"?: string | null,"id"?: string,"name": string,"notes"?: string | null,"target_amount"?: number | null,"target_date"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "account_id"?: string | null,"active"?: boolean,"created_at"?: string,"created_by"?: string | null,"description"?: string | null,"id"?: string,"name"?: string,"notes"?: string | null,"target_amount"?: number | null,"target_date"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "funds_account_id_fkey"
      columns: ["account_id"]
isOneToOne: false
      referencedRelation: "account_balances"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "funds_account_id_fkey"
      columns: ["account_id"]
isOneToOne: false
      referencedRelation: "accounts"
      referencedColumns: ["id"]
    }
                  ]
                },"payment_methods": {
                  Row: {
                    "active": boolean,"created_at": string,"id": string,"name": string,"sort_order": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"created_at"?: string,"id"?: string,"name": string,"sort_order"?: number,"updated_at"?: string
                  }
                  Update: {
                    "active"?: boolean,"created_at"?: string,"id"?: string,"name"?: string,"sort_order"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"profiles": {
                  Row: {
                    "active": boolean,"created_at": string,"email": string,"full_name": string,"id": string,"phone": string | null,"role": Database["public"]['Enums']["app_role"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"created_at"?: string,"email"?: string,"full_name"?: string,"id": string,"phone"?: string | null,"role"?: Database["public"]['Enums']["app_role"],"updated_at"?: string
                  }
                  Update: {
                    "active"?: boolean,"created_at"?: string,"email"?: string,"full_name"?: string,"id"?: string,"phone"?: string | null,"role"?: Database["public"]['Enums']["app_role"],"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"revenue_categories": {
                  Row: {
                    "active": boolean,"created_at": string,"id": string,"name": string,"sort_order": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"created_at"?: string,"id"?: string,"name": string,"sort_order"?: number,"updated_at"?: string
                  }
                  Update: {
                    "active"?: boolean,"created_at"?: string,"id"?: string,"name"?: string,"sort_order"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"service_items": {
                  Row: {
                    "created_at": string,"description": string,"id": string,"kind": Database["public"]['Enums']["line_item_kind"],"quantity": number,"service_id": string,"sort_order": number,"total": number | null,"unit_cost": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"description": string,"id"?: string,"kind"?: Database["public"]['Enums']["line_item_kind"],"quantity"?: number,"service_id": string,"sort_order"?: number,"total"?: never,"unit_cost": number,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"description"?: string,"id"?: string,"kind"?: Database["public"]['Enums']["line_item_kind"],"quantity"?: number,"service_id"?: string,"sort_order"?: number,"total"?: never,"unit_cost"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "service_items_service_id_fkey"
      columns: ["service_id"]
isOneToOne: false
      referencedRelation: "service_costs"
      referencedColumns: ["service_id"]
    },{
      foreignKeyName: "service_items_service_id_fkey"
      columns: ["service_id"]
isOneToOne: false
      referencedRelation: "services"
      referencedColumns: ["id"]
    }
                  ]
                },"service_types": {
                  Row: {
                    "active": boolean,"created_at": string,"id": string,"name": string,"sort_order": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"created_at"?: string,"id"?: string,"name": string,"sort_order"?: number,"updated_at"?: string
                  }
                  Update: {
                    "active"?: boolean,"created_at"?: string,"id"?: string,"name"?: string,"sort_order"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"services": {
                  Row: {
                    "address": string | null,"completed_at": string | null,"contract_value": number | null,"created_at": string,"created_by": string | null,"customer_id": string,"description": string | null,"id": string,"notes": string | null,"requested_date": string,"responsible_id": string | null,"responsible_name": string | null,"scheduled_at": string | null,"service_type_id": string | null,"status": Database["public"]['Enums']["service_status"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "address"?: string | null,"completed_at"?: string | null,"contract_value"?: number | null,"created_at"?: string,"created_by"?: string | null,"customer_id": string,"description"?: string | null,"id"?: string,"notes"?: string | null,"requested_date"?: string,"responsible_id"?: string | null,"responsible_name"?: string | null,"scheduled_at"?: string | null,"service_type_id"?: string | null,"status"?: Database["public"]['Enums']["service_status"],"updated_at"?: string
                  }
                  Update: {
                    "address"?: string | null,"completed_at"?: string | null,"contract_value"?: number | null,"created_at"?: string,"created_by"?: string | null,"customer_id"?: string,"description"?: string | null,"id"?: string,"notes"?: string | null,"requested_date"?: string,"responsible_id"?: string | null,"responsible_name"?: string | null,"scheduled_at"?: string | null,"service_type_id"?: string | null,"status"?: Database["public"]['Enums']["service_status"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "services_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "services_responsible_id_fkey"
      columns: ["responsible_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "services_service_type_id_fkey"
      columns: ["service_type_id"]
isOneToOne: false
      referencedRelation: "service_types"
      referencedColumns: ["id"]
    }
                  ]
                },"transactions": {
                  Row: {
                    "account_id": string | null,"amount": number,"campaign_id": string | null,"competence_date": string,"created_at": string,"created_by": string | null,"customer_id": string | null,"description": string,"due_date": string | null,"expense_category_id": string | null,"id": string,"kind": Database["public"]['Enums']["transaction_kind"],"notes": string | null,"payment_method_id": string | null,"revenue_category_id": string | null,"service_id": string | null,"settled_date": string | null,"status": Database["public"]['Enums']["transaction_status"],"supplier": string | null,"to_account_id": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "account_id"?: string | null,"amount": number,"campaign_id"?: string | null,"competence_date"?: string,"created_at"?: string,"created_by"?: string | null,"customer_id"?: string | null,"description": string,"due_date"?: string | null,"expense_category_id"?: string | null,"id"?: string,"kind": Database["public"]['Enums']["transaction_kind"],"notes"?: string | null,"payment_method_id"?: string | null,"revenue_category_id"?: string | null,"service_id"?: string | null,"settled_date"?: string | null,"status"?: Database["public"]['Enums']["transaction_status"],"supplier"?: string | null,"to_account_id"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "account_id"?: string | null,"amount"?: number,"campaign_id"?: string | null,"competence_date"?: string,"created_at"?: string,"created_by"?: string | null,"customer_id"?: string | null,"description"?: string,"due_date"?: string | null,"expense_category_id"?: string | null,"id"?: string,"kind"?: Database["public"]['Enums']["transaction_kind"],"notes"?: string | null,"payment_method_id"?: string | null,"revenue_category_id"?: string | null,"service_id"?: string | null,"settled_date"?: string | null,"status"?: Database["public"]['Enums']["transaction_status"],"supplier"?: string | null,"to_account_id"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "transactions_account_id_fkey"
      columns: ["account_id"]
isOneToOne: false
      referencedRelation: "account_balances"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "transactions_account_id_fkey"
      columns: ["account_id"]
isOneToOne: false
      referencedRelation: "accounts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "transactions_campaign_fk"
      columns: ["campaign_id"]
isOneToOne: false
      referencedRelation: "campaigns"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "transactions_customer_fk"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "transactions_expense_category_id_fkey"
      columns: ["expense_category_id"]
isOneToOne: false
      referencedRelation: "expense_categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "transactions_payment_method_id_fkey"
      columns: ["payment_method_id"]
isOneToOne: false
      referencedRelation: "payment_methods"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "transactions_revenue_category_id_fkey"
      columns: ["revenue_category_id"]
isOneToOne: false
      referencedRelation: "revenue_categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "transactions_service_fk"
      columns: ["service_id"]
isOneToOne: false
      referencedRelation: "service_costs"
      referencedColumns: ["service_id"]
    },{
      foreignKeyName: "transactions_service_fk"
      columns: ["service_id"]
isOneToOne: false
      referencedRelation: "services"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "transactions_to_account_id_fkey"
      columns: ["to_account_id"]
isOneToOne: false
      referencedRelation: "account_balances"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "transactions_to_account_id_fkey"
      columns: ["to_account_id"]
isOneToOne: false
      referencedRelation: "accounts"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            "account_balances": {
                  Row: {
                    "active": boolean,"balance": number | null,"id": string,"name": string,"opening_balance": number,"opening_date": string,"type": Database["public"]['Enums']["account_type"]
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"budget_totals": {
                  Row: {
                    "budget_id": string,"discount": number,"labor_total": number | null,"materials_total": number | null,"other_total": number | null,"subtotal": number | null,"total": number | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"financial_position": {
                  Row: {
                    "available_balance": number | null,"free_balance": number | null,"payable": number | null,"receivable": number | null,"reserved_balance": number | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"fund_balances": {
                  Row: {
                    "account_id": string | null,"active": boolean,"balance": number | null,"description": string | null,"id": string,"name": string,"target_amount": number | null,"target_date": string | null,"target_percent": number | null,"total_deposits": number | null,"total_withdrawals": number | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "funds_account_id_fkey"
      columns: ["account_id"]
isOneToOne: false
      referencedRelation: "account_balances"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "funds_account_id_fkey"
      columns: ["account_id"]
isOneToOne: false
      referencedRelation: "accounts"
      referencedColumns: ["id"]
    }
                  ]
                },"service_costs": {
                  Row: {
                    "labor_cost": number | null,"material_cost": number | null,"other_cost": number | null,"service_id": string,"total_cost": number | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                }
          }
          Functions: {
            "can_access_attachment_entity":
{ Args: { "p_entity_type": string }; Returns: boolean
                           },
"convert_budget_to_service":
{ Args: { "p_budget_id": string }; Returns: string
                           },
"current_app_role":
{ Args: Record<PropertyKey, never>; Returns: Database["public"]['Enums']["app_role"]
                           },
"has_role":
{ Args: { "roles": (Database["public"]['Enums']["app_role"])[] }; Returns: boolean
                           },
"is_active_user":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           }
          }
          Enums: {
            "account_type": "banco"|"caixa"|"carteira_digital"|"outro","ad_platform": "instagram_ads"|"facebook_ads"|"google_ads"|"outras","app_role": "admin"|"financeiro"|"operacional","attribution_type": "declarada"|"rastreada"|"desconhecida","budget_status": "aguardando"|"aprovado"|"recusado"|"expirado","campaign_status": "planejada"|"ativa"|"pausada"|"encerrada","customer_status": "novo_contato"|"em_atendimento"|"cliente"|"inativo","expense_class": "custo_direto"|"despesa_operacional"|"investimento"|"imposto","fund_movement_kind": "deposito"|"retirada","line_item_kind": "material"|"mao_de_obra"|"outro","service_status": "solicitado"|"agendado"|"em_andamento"|"aguardando_material"|"concluido"|"cancelado","transaction_kind": "receita"|"despesa"|"transferencia","transaction_status": "pendente"|"efetivado"|"cancelado"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "account_type": ["banco", "caixa", "carteira_digital", "outro"],"ad_platform": ["instagram_ads", "facebook_ads", "google_ads", "outras"],"app_role": ["admin", "financeiro", "operacional"],"attribution_type": ["declarada", "rastreada", "desconhecida"],"budget_status": ["aguardando", "aprovado", "recusado", "expirado"],"campaign_status": ["planejada", "ativa", "pausada", "encerrada"],"customer_status": ["novo_contato", "em_atendimento", "cliente", "inativo"],"expense_class": ["custo_direto", "despesa_operacional", "investimento", "imposto"],"fund_movement_kind": ["deposito", "retirada"],"line_item_kind": ["material", "mao_de_obra", "outro"],"service_status": ["solicitado", "agendado", "em_andamento", "aguardando_material", "concluido", "cancelado"],"transaction_kind": ["receita", "despesa", "transferencia"],"transaction_status": ["pendente", "efetivado", "cancelado"]
          }
        }
} as const
