/*
 *   Copyright (c) 2025 Stefano Marano https://github.com/StefanoMarano80017
 *   All rights reserved.

 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at

 *   http://www.apache.org/licenses/LICENSE-2.0

 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 */

import React from "react";
import TextFilter from "../Filters/TextFilter";
import EmployeeFilter from "../Filters/EmployeeFilter";

// Hook base per un filtro testuale
export const useTextFilter = (initialValue = "") => {
  const [value, setValue] = React.useState(initialValue);

  const filterFn = React.useCallback(
    (items, key = "title") => {
      if (!value) return items;
      return items.filter((item) =>
        item[key].toLowerCase().includes(value.toLowerCase())
      );
    },
    [value]
  );

  const render = () => (
    <TextFilter value={value} setValue={setValue} />
  );

  return { value, setValue, filterFn, render, label: "Testo" };
};

// Hook base per filtro multi-selezione
export const useMultiSelectFilter = (initialValue = [], options = [], label, key = "id") => {
  const [value, setValue] = React.useState(initialValue);

  const filterFn = React.useCallback(
    (items) => {
      if (!value || value.length === 0) return items;
      return items.filter((item) =>
        value.some((v) => item[key].includes(v))
      );
    },
    [value, key]
  );

  const render = () => (
    <EmployeeFilter value={value} setValue={setValue} options={options} />
  );

  return { value, setValue, filterFn, render, label };
};
