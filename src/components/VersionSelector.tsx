
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface VersionSelectorProps {
  currentVersion: string;
  onChange: (version: string) => void;
  versions: { value: string; label: string }[];
}

const VersionSelector: React.FC<VersionSelectorProps> = ({ currentVersion, onChange, versions }) => {
  return (
    <div className="flex flex-col space-y-1.5">
      <Label htmlFor="version-select">App Version</Label>
      <Select value={currentVersion} onValueChange={onChange}>
        <SelectTrigger id="version-select" className="w-[140px]">
          <SelectValue placeholder="Select Version" />
        </SelectTrigger>
        <SelectContent position="popper">
          {versions.map((version) => (
            <SelectItem key={version.value} value={version.value}>
              {version.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default VersionSelector;
