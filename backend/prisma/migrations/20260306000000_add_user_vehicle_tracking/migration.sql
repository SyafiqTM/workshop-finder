ALTER TABLE `User`
    ADD COLUMN `currentMileage` INTEGER NULL,
    ADD COLUMN `lastEngineOilChangeMileage` INTEGER NULL,
    ADD COLUMN `lastAtfChangeMileage` INTEGER NULL,
    ADD COLUMN `mileageRecords` JSON NULL;