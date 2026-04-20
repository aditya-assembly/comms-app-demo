import type { MouseEvent } from "react";
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, X, ChevronDown, Check, Search, Link2, ChevronLeft, ChevronRight, SearchX } from "lucide-react";
import { getEntityDisplayAttributesText, getEntityDisplayAttributes, getAttributeDisplayName } from "./console-utils";
import { FILTER_OPERATORS, ATTRIBUTE_TYPES, type FilterOperator } from "@/config/orchestration-constants";
import { useEntitySpec, useEntitySearch } from "@/hooks/use-comms-api";
import type { Entity, EntitySpec, EntityDocQueryBuilder, EntityFilter, EntitySpecWithLegacy, AttributeSpec, EntityAttributeEventConfig, EntityAttributeSubscriptionConfig } from "@/types/orchestration-dashboard-types";
import type { EventSessionManager, EventData } from "@/lib/event-session-manager";

interface EntityAttributeInputProps {
  input: {
    name: string;
    type: string;
    description: string | null;
    entitySpecId?: string;
    entityFilters?: EntityFilter[];
    displayAttributes?: string[];
    currentState?: string[];
    searchAttribute?: string;
    multiSelect?: boolean;
    publishedEvents?: EntityAttributeEventConfig[];
    subscriptions?: EntityAttributeSubscriptionConfig[];
  };
  value: string | string[];
  onChange: (value: string | string[]) => void;
  isRequired: boolean;
  error: boolean;
  assemblyId: string;
  workflowId: string;
  disabled: boolean;
  eventManager?: EventSessionManager | null;
}

export function EntityAttributeInput({ input, value, onChange, error, assemblyId, workflowId, disabled, eventManager }: EntityAttributeInputProps) {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearchInput, setDebouncedSearchInput] = useState("");
  const [open, setOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedEntities, setSelectedEntities] = useState<Record<string, Entity>>({});
  const [subscriptionFilters, setSubscriptionFilters] = useState<EntityFilter[]>([]);
  const [, setEventVersion] = useState(0);
  const lastReceivedEventValueByKey = useRef<Record<string, unknown>>({});
  /** When we just published a new selection, our subscriber may clear and publish null; skip clearing ourselves when we receive that cascade null. */
  const skipNextClearFromCascade = useRef(false);
  /** Value we just published (id or ids); don't clear ourselves when we receive this value (e.g. same event key or cross-talk). */
  const lastPublishedValue = useRef<string | string[] | null>(null);
  /** True while we're inside publishEventsForSelection; never clear ourselves during our own publish turn. */
  const publishingInProgress = useRef(false);
  const pageSize = 20;

  const subscriptions = useMemo(() => input.subscriptions ?? [], [input.subscriptions]);
  const publishedEvents = useMemo(() => input.publishedEvents ?? [], [input.publishedEvents]);
  const hasRequiredSubscriptions = subscriptions.some((s) => s.required);
  const canLoadEntities = !hasRequiredSubscriptions || (!!eventManager && subscriptions.filter((s) => s.required).every((s) => eventManager.hasRequiredEvent(s.eventKey)));
  const requiredNotMetNames =
    hasRequiredSubscriptions && eventManager ? [...new Set(subscriptions.filter((s) => s.required && !eventManager.hasRequiredEvent(s.eventKey)).map((s) => s.sourceAttributeName))] : [];

  // Publish null for all our events so downstream subscribers (e.g. C in A→B→C) clear their values.
  const publishEmptyEvents = useCallback(() => {
    if (!eventManager || publishedEvents.length === 0) return;
    const entitySpecId = input.entitySpecId ?? "";
    publishedEvents.forEach((ev) => {
      eventManager.publishEvent(ev.eventKey, {
        eventKey: ev.eventKey,
        attributeName: input.name,
        attributePath: ev.attributePath ?? "id",
        attributeType: ev.attributeType ?? "STRING",
        attributeValue: null,
        entitySpecId,
        timestamp: Date.now(),
      });
    });
  }, [eventManager, publishedEvents, input.name, input.entitySpecId]);

  // Clear our value and publish empty so our subscribers (e.g. C when A→B→C) also clear. Used when we receive an event (publisher changed).
  const clearValueAndPublishEmpty = useCallback(() => {
    setSelectedEntities({});
    onChange("");
    publishEmptyEvents();
  }, [onChange, publishEmptyEvents]);

  // Subscribe to events: update subscription filters, clear our value when publisher changes, and cascade (publish empty so our subscribers clear)
  useEffect(() => {
    if (!eventManager || subscriptions.length === 0) return;
    const unsubs: (() => void)[] = [];
    subscriptions.forEach((sub) => {
      const unsub = eventManager.subscribe(sub.eventKey, (eventData: EventData) => {
        const value = eventData.attributeValue;
        const op = sub.filterOperator ?? "$eq";
        setSubscriptionFilters((prev) => {
          const withoutThis = prev.filter((f) => f.field !== sub.filterAttributePath);
          if (value == null) return withoutThis;
          const needsArray = op === "$in" || op === "$nin";
          const filterValue = needsArray && !Array.isArray(value) ? [value] : value;
          const filter: EntityFilter = {
            "@type": "DocumentEntityFilter",
            field: sub.filterAttributePath,
            operator: op as FilterOperator,
            value: filterValue,
          };
          return [...withoutThis, filter];
        });
        setEventVersion((v) => v + 1);
        // Clear our value when the publisher cleared (null) or when the publisher's value changed (so subscriber
        // doesn't keep a stale selection). Do not clear on initial sync (no previous value for this event key).
        const prev = lastReceivedEventValueByKey.current[sub.eventKey];
        lastReceivedEventValueByKey.current[sub.eventKey] = value;
        const valueChanged = prev !== undefined && (value == null || (Array.isArray(prev) && Array.isArray(value) ? JSON.stringify(prev) !== JSON.stringify(value) : prev !== value));
        if (value == null) {
          if (publishingInProgress.current || skipNextClearFromCascade.current) {
            skipNextClearFromCascade.current = false;
            lastPublishedValue.current = null;
          } else {
            clearValueAndPublishEmpty();
          }
        } else if (valueChanged) {
          if (publishingInProgress.current) {
            lastPublishedValue.current = null;
          } else {
            const isValueWeJustPublished =
              lastPublishedValue.current != null &&
              (Array.isArray(value) && Array.isArray(lastPublishedValue.current) ? JSON.stringify(value) === JSON.stringify(lastPublishedValue.current) : value === lastPublishedValue.current);
            if (isValueWeJustPublished) {
              lastPublishedValue.current = null;
            } else {
              clearValueAndPublishEmpty();
            }
          }
        }
      });
      unsubs.push(unsub);
    });
    return () => {
      lastReceivedEventValueByKey.current = {};
      lastPublishedValue.current = null;
      publishingInProgress.current = false;
      unsubs.forEach((u) => u());
    };
  }, [eventManager, subscriptions, clearValueAndPublishEmpty]);

  // Normalize value to array for consistent handling
  const selectedEntityIds = useMemo(() => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }, [value]);

  // Use local selectedEntities when value hasn't caught up (e.g. parent update delayed) so the selection shows immediately
  const displayEntityIds = useMemo(() => (selectedEntityIds.length > 0 ? selectedEntityIds : Object.keys(selectedEntities)), [selectedEntityIds, selectedEntities]);

  // Fetch entity spec
  const { data: entitySpecData } = useEntitySpec(assemblyId, workflowId, input.entitySpecId, input.name);

  // Normalize the spec: convert attributesSpec object to attributes array if needed
  const entitySpec = useMemo(() => {
    if (!entitySpecData) return null;
    return {
      ...entitySpecData,
      attributes: entitySpecData.attributes || ((entitySpecData as EntitySpecWithLegacy).attributesSpec ? Object.values((entitySpecData as EntitySpecWithLegacy).attributesSpec!) : []),
    };
  }, [entitySpecData]);

  // Look up the search attribute spec to determine type and allowed values
  const searchAttrSpec = useMemo(() => {
    if (!input.searchAttribute || !entitySpec?.attributes) return null;
    return entitySpec.attributes.find((attr: AttributeSpec) => attr.name === input.searchAttribute) || null;
  }, [input.searchAttribute, entitySpec?.attributes]);

  // Search config types
  type AttributeSearchConfig = {
    type: string;
    allowedValues: string[] | null;
    operator: FilterOperator;
    searchField: string;
  };
  type UniqueNameSearchConfig = {
    searchField: string;
    displayLabel: string;
  };
  type SearchConfig = AttributeSearchConfig | UniqueNameSearchConfig;

  // Determine search configuration
  // Priority: searchAttribute → uniqueName (direct field, not filter)
  const searchConfig = useMemo((): SearchConfig | null => {
    if (!entitySpec) return null;

    // Use searchAttribute if specified - search via entityFilters
    if (input.searchAttribute && searchAttrSpec?.type) {
      const attrType = searchAttrSpec.type;
      const allowedValues = searchAttrSpec.allowedValues || null;

      // Get operator based on type
      const getOperator = (): FilterOperator => {
        if (allowedValues?.length) return FILTER_OPERATORS.EQ;
        if (attrType === ATTRIBUTE_TYPES.DATE || attrType === ATTRIBUTE_TYPES.NUMBER_INTEGER || attrType === ATTRIBUTE_TYPES.NUMBER_DOUBLE || attrType === ATTRIBUTE_TYPES.BOOLEAN)
          return FILTER_OPERATORS.EQ;
        if (attrType === ATTRIBUTE_TYPES.STRING || attrType === ATTRIBUTE_TYPES.STRING_ARRAY) return FILTER_OPERATORS.CONTAINS;
        return FILTER_OPERATORS.EQ;
      };

      return {
        type: attrType,
        allowedValues,
        operator: getOperator(),
        searchField: input.searchAttribute,
      };
    }

    // Fallback: search via uniqueName field (passed directly to queryBuilder)
    return {
      searchField: "uniqueName",
      displayLabel: entitySpec.uniqueNameAttribute || "ID",
    };
  }, [input.searchAttribute, searchAttrSpec, entitySpec]);

  // Build full EntityDocQueryBuilder with preset filters + subscription filters + user search
  const queryBuilder: EntityDocQueryBuilder | undefined = useMemo(() => {
    if (!input.entitySpecId || !open) return undefined;
    if (!canLoadEntities && hasRequiredSubscriptions) return undefined;

    const entityFilters: EntityFilter[] = [...(input.entityFilters || []), ...subscriptionFilters];
    let uniqueName: string | undefined;

    // Add search based on whether searchAttribute is configured
    if (searchConfig && debouncedSearchInput.trim()) {
      if (input.searchAttribute) {
        // Attribute search - add as entity filter
        const attrConfig = searchConfig as AttributeSearchConfig;
        entityFilters.push({
          "@type": "DocumentEntityFilter",
          field: attrConfig.searchField,
          operator: attrConfig.operator,
          value: debouncedSearchInput.trim(),
        });
      } else {
        // UniqueName search - pass directly to queryBuilder
        uniqueName = debouncedSearchInput.trim();
      }
    }

    // Normalize currentState: remove empty strings so we don't send e.g. ["", "ACTIVE"]
    const currentState = input.currentState && Array.isArray(input.currentState) ? input.currentState.filter((s) => s != null && String(s).trim() !== "") : input.currentState;

    return {
      objectSpecID: input.entitySpecId,
      assemblyID: assemblyId,
      entityFilters,
      uniqueName,
      currentState: currentState && currentState.length > 0 ? currentState : undefined,
      page: currentPage,
      pageSize: pageSize,
      includeDeleted: false,
    };
  }, [
    input.entitySpecId,
    input.entityFilters,
    input.currentState,
    input.searchAttribute,
    assemblyId,
    debouncedSearchInput,
    currentPage,
    pageSize,
    open,
    canLoadEntities,
    hasRequiredSubscriptions,
    subscriptionFilters,
    searchConfig,
  ]);

  const searchEnabled = open && !!input.entitySpecId && canLoadEntities;
  const { data: searchResult, isLoading } = useEntitySearch(assemblyId, workflowId, queryBuilder, searchEnabled);

  const entities = searchResult?.results || [];
  const totalCount = searchResult?.totalCount || 0;

  // Debounce search input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchInput(searchInput);
      setCurrentPage(0); // Reset to first page on new search
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  // Reset search when popover closes
  useEffect(() => {
    if (!open) {
      setSearchInput("");
      setDebouncedSearchInput("");
      setCurrentPage(0);
    }
  }, [open]);

  const getEntityPrimaryText = (entity: Entity) => {
    // Use searchAttribute value if specified, otherwise use display name from entity spec
    if (input.searchAttribute && entity.attributes?.[input.searchAttribute]) {
      const attrValue = entity.attributes[input.searchAttribute].value;
      return String(attrValue || getEntityDisplayAttributes(entity, entitySpec ?? undefined));
    }
    return getEntityDisplayAttributes(entity, entitySpec ?? undefined);
  };

  const getEntitySecondaryText = (entity: Entity, spec?: EntitySpec | null) => {
    const attributesText = getEntityDisplayAttributesText(entity, input.displayAttributes, spec || undefined, 2);
    return attributesText || entity.description || null;
  };

  const publishEventsForSelection = useCallback(
    (currentValue: string | string[], entitiesMap: Record<string, Entity>) => {
      if (!eventManager || publishedEvents.length === 0) return;
      const ids = Array.isArray(currentValue) ? currentValue : currentValue ? [currentValue] : [];
      const entitySpecId = input.entitySpecId ?? "";

      publishedEvents.forEach((ev) => {
        const path = (ev.attributePath ?? "id").trim() || "id";
        let attributeValue: unknown;
        if (input.multiSelect) {
          attributeValue = ids;
        } else {
          const singleId = ids[0];
          if (!singleId) {
            attributeValue = null;
          } else if (path === "id") {
            // "id" = the selected entity's id (this entity's id)
            attributeValue = singleId;
          } else {
            // path = attribute name (e.g. "Client" for a REFERENCE) → publish that attribute's value
            const ent = entitiesMap[singleId];
            const attr = ent?.attributes?.[path] as { value?: unknown; referenceIdList?: string[] } | undefined;
            const raw = attr?.value ?? attr?.referenceIdList ?? null;
            if (raw == null) {
              attributeValue = null;
            } else if (Array.isArray(raw)) {
              // REFERENCE and similar: use first id for single-value filters, or full array for $in
              attributeValue = raw.length === 1 ? raw[0] : raw;
            } else {
              attributeValue = raw;
            }
          }
        }
        const eventData: EventData = {
          eventKey: ev.eventKey,
          attributeName: input.name,
          attributePath: path,
          attributeType: ev.attributeType ?? "STRING",
          attributeValue,
          entitySpecId,
          timestamp: Date.now(),
        };
        eventManager.publishEvent(ev.eventKey, eventData);
      });
    },
    [eventManager, publishedEvents, input.multiSelect, input.name, input.entitySpecId],
  );

  const handleToggleEntity = (entity: Entity) => {
    const isSelected = selectedEntityIds.includes(entity.id);
    let newIds: string[];

    if (!input.multiSelect) {
      if (isSelected) {
        setSelectedEntities({});
        onChange("");
        publishEmptyEvents();
        setOpen(false);
        return;
      }
      newIds = [entity.id];
      setSelectedEntities({ [entity.id]: entity });
      onChange(entity.id);
      setOpen(false);
      // Publish in next tick so value is committed first; then any cascade (subscriber clears → we receive null) won't overwrite our value
      setTimeout(() => {
        publishingInProgress.current = true;
        skipNextClearFromCascade.current = true;
        lastPublishedValue.current = entity.id;
        publishEventsForSelection(entity.id, { [entity.id]: entity });
        publishingInProgress.current = false;
      }, 0);
      return;
    }

    if (isSelected) {
      newIds = selectedEntityIds.filter((id) => id !== entity.id);
    } else {
      newIds = [...selectedEntityIds, entity.id];
    }

    if (!isSelected) {
      setSelectedEntities((prev) => ({ ...prev, [entity.id]: entity }));
    } else {
      setSelectedEntities((prev) => {
        const updated = { ...prev };
        delete updated[entity.id];
        return updated;
      });
    }

    const newValue = newIds.length === 1 ? newIds[0] : newIds;
    const nextEntities: Record<string, Entity> = !isSelected ? { ...selectedEntities, [entity.id]: entity } : Object.fromEntries(Object.entries(selectedEntities).filter(([id]) => id !== entity.id));
    onChange(newValue);
    if (newIds.length > 0) {
      setTimeout(() => {
        publishingInProgress.current = true;
        skipNextClearFromCascade.current = true;
        lastPublishedValue.current = newValue;
        publishEventsForSelection(newValue, nextEntities);
        publishingInProgress.current = false;
      }, 0);
    } else {
      publishEventsForSelection(newValue, nextEntities);
    }
  };

  const handleRemoveEntity = useCallback(
    (entityId: string) => {
      const newIds = selectedEntityIds.filter((id) => id !== entityId);
      const nextEntities = Object.fromEntries(Object.entries(selectedEntities).filter(([id]) => id !== entityId));
      setSelectedEntities((prev) => {
        const updated = { ...prev };
        delete updated[entityId];
        return updated;
      });
      const newValue = newIds.length === 1 ? newIds[0] : newIds.length === 0 ? "" : newIds;
      onChange(newValue);
      if (newIds.length > 0) {
        setTimeout(() => {
          publishingInProgress.current = true;
          skipNextClearFromCascade.current = true;
          lastPublishedValue.current = newValue;
          publishEventsForSelection(newValue, nextEntities);
          publishingInProgress.current = false;
        }, 0);
      } else {
        publishEventsForSelection(newValue, nextEntities);
      }
    },
    [selectedEntityIds, selectedEntities, onChange, publishEventsForSelection],
  );

  const selectedEntitiesList = displayEntityIds.map((id) => selectedEntities[id]).filter(Boolean) as Entity[];

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled || !input.entitySpecId || (hasRequiredSubscriptions && !canLoadEntities)}
            className={`focus-border-only group w-full justify-between h-auto min-h-[3rem] py-3 text-left bg-background/50 border rounded-xl transition-all duration-200 px-4 hover:bg-black/5 dark:hover:bg-white/10 outline-none focus-visible:ring-0 focus-visible:border-primary ${
              error ? "border-red-300/50 focus-visible:border-red-400" : "border-border/50 hover:border-primary/30"
            }`}
          >
            {selectedEntitiesList.length > 0 ? (
              <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
                {input.multiSelect ? (
                  <>
                    {selectedEntitiesList.slice(0, 2).map((entity) => (
                      <Badge key={entity.id} variant="primarySoft" className="pl-3 pr-2 py-1.5 flex items-center gap-2 rounded-lg font-medium">
                        <Link2 className="h-3 w-3 flex-shrink-0" />
                        <span className="text-xs truncate max-w-[120px]">{getEntityPrimaryText(entity)}</span>
                      </Badge>
                    ))}
                    {selectedEntitiesList.length > 2 && (
                      <Badge variant="secondary" className="px-2 py-1.5 text-xs">
                        +{selectedEntitiesList.length - 2} more
                      </Badge>
                    )}
                  </>
                ) : (
                  <Badge variant="primarySoft" className="pl-3 pr-2 py-1.5 flex items-center gap-2 rounded-lg font-medium">
                    <Link2 className="h-3 w-3 flex-shrink-0" />
                    <span className="text-xs truncate max-w-[120px]">{getEntityPrimaryText(selectedEntitiesList[0])}</span>
                  </Badge>
                )}
              </div>
            ) : hasRequiredSubscriptions && !canLoadEntities ? (
              <span className="text-sm text-muted-foreground">Please select {requiredNotMetNames.length ? requiredNotMetNames.join(", ") : "dependencies"} first</span>
            ) : (
              <span className="text-sm text-muted-foreground">Select {input.name}...</span>
            )}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl border-2 border-muted/30 shadow-lg" align="start">
          <div className="flex flex-col">
            {/* Selected Entities Display - Show at top if any selected and multiSelect is enabled */}
            {selectedEntitiesList.length > 0 && input.multiSelect && (
              <div className="px-3 py-2.5 border-b border-primary/15 bg-primary/5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className="px-2 py-0.5 rounded-lg bg-primary text-white text-[10px] font-bold border-0">{selectedEntitiesList.length}</Badge>
                      <span className="text-xs font-medium text-primary">{selectedEntitiesList.length === 1 ? "record" : "records"} selected</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2.5 text-xs rounded-lg text-primary hover:bg-primary/15 hover:text-primary transition-colors duration-200"
                      onClick={(e: MouseEvent<HTMLButtonElement>) => {
                        e.stopPropagation();
                        setSelectedEntities({});
                        onChange("");
                        publishEmptyEvents();
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto scrollbar-thin">
                    {selectedEntitiesList.map((entity) => (
                      <Badge key={entity.id} variant="primarySoft" className="pl-2 pr-1.5 py-1 flex items-center gap-1.5 rounded-lg">
                        <Link2 className="h-3 w-3 flex-shrink-0" />
                        <span className="text-xs truncate max-w-[100px]">{getEntityPrimaryText(entity)}</span>
                        <button
                          type="button"
                          className="h-4 w-4 p-0 flex items-center justify-center hover:bg-destructive/20 hover:text-destructive rounded-md transition-colors duration-150"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveEntity(entity.id);
                          }}
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Preset Filters Display - Show if any preset filters exist */}
            {input.entityFilters && input.entityFilters.length > 0 && (
              <div className="px-3 py-2 border-b border-muted/20 bg-muted/10">
                <div className="flex items-center gap-2 mb-1.5">
                  <Badge variant="muted" className="text-[10px] px-1.5 py-0 h-4">
                    Preset Filters
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {input.entityFilters.length} filter{input.entityFilters.length !== 1 ? "s" : ""} applied
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {input.entityFilters.map((filter, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0.5 h-5 bg-muted/20 text-muted-foreground border border-muted/30 rounded-md"
                      title={`${filter.field} ${filter.operator} ${String(filter.value)}`}
                    >
                      {filter.field}: {String(filter.value).substring(0, 20)}
                      {String(filter.value).length > 20 ? "..." : ""}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Search Input */}
            {searchConfig && (
              <div className="px-3 py-2.5 border-b border-muted/20">
                {input.searchAttribute ? (
                  // Attribute search - show type-specific inputs
                  (() => {
                    const attrConfig = searchConfig as AttributeSearchConfig;
                    const displayLabel = searchAttrSpec?.description || input.searchAttribute;

                    // STRING with allowedValues - show dropdown
                    if (attrConfig.allowedValues && attrConfig.allowedValues.length > 0) {
                      return (
                        <Select
                          value={searchInput}
                          onValueChange={(value) => {
                            setSearchInput(value);
                            setDebouncedSearchInput(value);
                            setCurrentPage(0);
                          }}
                        >
                          <SelectTrigger className="h-10 rounded-xl border-2 border-muted/30 bg-background/70 hover:border-primary/30 focus:border-primary/50 transition-all duration-200">
                            <SelectValue placeholder={`Select ${displayLabel}...`} />
                          </SelectTrigger>
                          <SelectContent>
                            {attrConfig.allowedValues.map((option: string) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      );
                    }

                    // BOOLEAN - show Yes/No dropdown
                    if (attrConfig.type === ATTRIBUTE_TYPES.BOOLEAN) {
                      return (
                        <Select
                          value={searchInput}
                          onValueChange={(value) => {
                            setSearchInput(value);
                            setDebouncedSearchInput(value);
                            setCurrentPage(0);
                          }}
                        >
                          <SelectTrigger className="h-10 rounded-xl border-2 border-muted/30 bg-background/70 hover:border-primary/30 focus:border-primary/50 transition-all duration-200">
                            <SelectValue placeholder={`Select ${displayLabel}...`} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Yes</SelectItem>
                            <SelectItem value="false">No</SelectItem>
                          </SelectContent>
                        </Select>
                      );
                    }

                    // DATE - show date input
                    if (attrConfig.type === ATTRIBUTE_TYPES.DATE) {
                      return (
                        <Input
                          type="date"
                          value={searchInput}
                          onChange={(e) => setSearchInput(e.target.value)}
                          className="h-10 rounded-xl border-2 border-muted/30 bg-background/70 hover:border-primary/30 focus:border-primary/50 transition-all duration-200"
                          autoFocus
                        />
                      );
                    }

                    // NUMBER - show number input
                    if (attrConfig.type === ATTRIBUTE_TYPES.NUMBER_INTEGER || attrConfig.type === ATTRIBUTE_TYPES.NUMBER_DOUBLE) {
                      return (
                        <div className="relative">
                          <div className="absolute left-2 inset-y-0 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <Input
                            type="number"
                            placeholder={`Search by ${displayLabel}...`}
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="pl-9 h-10 rounded-xl border-2 border-muted/30 bg-background/70 hover:border-primary/30 focus:border-primary/50 transition-all duration-200"
                            autoFocus
                          />
                        </div>
                      );
                    }

                    // STRING (default) - show text input
                    return (
                      <div className="relative">
                        <div className="absolute left-2 inset-y-0 flex items-center pointer-events-none">
                          <Search className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <Input
                          placeholder={`Search by ${displayLabel}...`}
                          value={searchInput}
                          onChange={(e) => setSearchInput(e.target.value)}
                          className="pl-9 h-10 rounded-xl border-2 border-muted/30 bg-background/70 hover:border-primary/30 focus:border-primary/50 transition-all duration-200"
                          autoFocus
                        />
                      </div>
                    );
                  })()
                ) : (
                  // UniqueName search - simple text input
                  <div className="relative">
                    <div className="absolute left-2 inset-y-0 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <Input
                      placeholder={`Search by ${(searchConfig as UniqueNameSearchConfig).displayLabel}...`}
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="pl-9 h-10 rounded-xl border-2 border-muted/30 bg-background/70 hover:border-primary/30 focus:border-primary/50 transition-all duration-200"
                      autoFocus
                    />
                  </div>
                )}
              </div>
            )}

            {/* Entity List */}
            <div className="max-h-[340px] overflow-y-auto scrollbar-thin" onWheel={(e) => e.stopPropagation()}>
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground">Searching records...</span>
                </div>
              ) : entities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div className="p-2.5 bg-muted/30 rounded-xl">
                    <SearchX className="h-5 w-5 text-muted-foreground/60" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">No records found</p>
                    {debouncedSearchInput.trim() && <p className="text-xs text-muted-foreground/70 mt-1">Try adjusting your search terms</p>}
                  </div>
                </div>
              ) : (
                <div className="p-1.5">
                  {entities.map((entity) => {
                    const isSelected = displayEntityIds.includes(entity.id);
                    const primaryText = getEntityPrimaryText(entity);
                    const secondaryText = entitySpec ? getEntitySecondaryText(entity, entitySpec) : null;

                    return (
                      <div
                        key={entity.id}
                        onClick={() => handleToggleEntity(entity)}
                        className={`flex items-start gap-3.5 p-3.5 rounded-xl cursor-pointer transition-all duration-200 mb-1 ${
                          isSelected ? "bg-primary/8 border border-primary/20 shadow-sm" : "hover:bg-black/5 dark:hover:bg-white/5 border border-transparent"
                        }`}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          {isSelected ? (
                            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-sm transition-all duration-200">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 transition-all duration-200 hover:border-primary/50" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          {/* Show searchAttribute value prominently at the top - this is what they're searching for */}
                          {input.searchAttribute && entity.attributes?.[input.searchAttribute] ? (
                            <>
                              <div className="flex items-center gap-2">
                                <Link2 className={`h-3.5 w-3.5 flex-shrink-0 ${isSelected ? "text-primary" : "text-muted-foreground/50"}`} />
                                <span className={`font-semibold text-sm ${isSelected ? "text-primary" : "text-foreground"}`}>{String(entity.attributes[input.searchAttribute].value)}</span>
                              </div>
                              {/* Show display attributes as secondary when searchAttribute is used */}
                              {getEntityDisplayAttributes(entity, entitySpec ?? undefined) !== entity.id && <p className="text-xs text-muted-foreground mt-1 ml-5.5 truncate">{getEntityDisplayAttributes(entity, entitySpec ?? undefined)}</p>}
                              {/* Show secondary text if available */}
                              {secondaryText && <p className="text-xs text-muted-foreground mt-0.5 ml-5.5 truncate">{secondaryText}</p>}
                            </>
                          ) : (
                            <>
                              <div className="flex items-center gap-2">
                                <Link2 className={`h-3.5 w-3.5 flex-shrink-0 ${isSelected ? "text-primary" : "text-muted-foreground/50"}`} />
                                <span className={`font-semibold text-sm ${isSelected ? "text-primary" : "text-foreground"}`}>{primaryText}</span>
                              </div>
                              {secondaryText && <p className="text-xs text-muted-foreground mt-1 ml-5.5 truncate">{secondaryText}</p>}
                            </>
                          )}
                          {entity.currentState && (
                            <Badge variant="primarySoft" className="mt-1.5 text-xs px-2 py-0.5 h-5">
                              {entity.currentState}
                            </Badge>
                          )}
                          {input.displayAttributes && input.displayAttributes.length > 2 && entitySpec && (
                            <div className="flex flex-wrap gap-2 mt-2 pt-2 ml-5.5 border-t border-border/30">
                              {input.displayAttributes.slice(2).map((attrKey) => {
                                const attr = entity.attributes?.[attrKey];
                                if (!attr) return null;
                                const attrSpec = entitySpec.attributes?.find((spec: AttributeSpec) => spec?.name === attrKey);
                                return (
                                  <div key={attrKey} className="flex items-center gap-1.5">
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{attrSpec?.description || (attrSpec ? getAttributeDisplayName(attrSpec) : attrKey)}:</span>
                                    <span className="text-xs text-foreground font-medium">{String(attr.value)}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalCount > pageSize &&
              (() => {
                const totalPages = Math.ceil(totalCount / pageSize);
                return (
                  <div className="px-3 py-2.5 border-t border-muted/20 flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">
                      {currentPage * pageSize + 1}-{Math.min((currentPage + 1) * pageSize, totalCount)} of {totalCount}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                        disabled={currentPage === 0 || isLoading}
                        className="h-7 w-7 p-0 rounded-lg border-muted/30"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </Button>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                          let pageNum: number;
                          if (totalPages <= 5) {
                            pageNum = i;
                          } else if (currentPage < 3) {
                            pageNum = i;
                          } else if (currentPage > totalPages - 4) {
                            pageNum = totalPages - 5 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "ghost"}
                              size="sm"
                              onClick={() => setCurrentPage(pageNum)}
                              disabled={isLoading}
                              className={`h-7 w-7 p-0 rounded-lg text-xs font-medium ${
                                currentPage === pageNum ? "bg-primary text-white hover:bg-primary/90" : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {pageNum + 1}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                        disabled={currentPage >= totalPages - 1 || isLoading}
                        className="h-7 w-7 p-0 rounded-lg border-muted/30"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })()}
          </div>
        </PopoverContent>
      </Popover>
      {error && <p className="text-xs text-destructive">This field is required</p>}
      {input.description && !error && selectedEntitiesList.length === 0 && <p className="text-xs text-muted-foreground">{input.description}</p>}
    </div>
  );
}
