"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("champions", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      name: Sequelize.STRING,
      bornDate: Sequelize.STRING,
      title: Sequelize.STRING,
      xp: Sequelize.FLOAT,
      xpBoost: Sequelize.FLOAT,
      level: Sequelize.INTEGER,
      daystreak: Sequelize.INTEGER,
      lastDaystreakUpdate: Sequelize.DATE,
      biography: Sequelize.TEXT,
      daystreakShield: Sequelize.INTEGER,
      tobiasCoins: Sequelize.FLOAT,
      achievementPoints: Sequelize.INTEGER,
      lastFreeQuestUpdate: Sequelize.DATE,
    });

    await queryInterface.createTable("statistics", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      strength: Sequelize.INTEGER,
      agility: Sequelize.INTEGER,
      inteligence: Sequelize.INTEGER,
      vitality: Sequelize.INTEGER,
      wisdom: Sequelize.INTEGER,
      champion_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "champions", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
    });

    await queryInterface.createTable("activities", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      kmRun: Sequelize.FLOAT,
      jumpRope: Sequelize.FLOAT,
      kmBike: Sequelize.FLOAT,
      upperLimb: Sequelize.FLOAT,
      abs: Sequelize.FLOAT,
      lowerLimb: Sequelize.FLOAT,
      meals: Sequelize.FLOAT,
      drinks: Sequelize.FLOAT,
      sleep: Sequelize.FLOAT,
      study: Sequelize.FLOAT,
      meditation: Sequelize.FLOAT,
      reading: Sequelize.FLOAT,
      champion_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "champions", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
    });

    await queryInterface.createTable("files", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      image: Sequelize.STRING,
      champion_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "champions", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
    });

    await queryInterface.createTable("calendars", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      red_day: Sequelize.INTEGER,
      yellow_day: Sequelize.INTEGER,
      green_day: Sequelize.INTEGER,
      champion_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "champions", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
    });

    await queryInterface.createTable("events", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      title: Sequelize.STRING,
      date: Sequelize.STRING,
      display: Sequelize.STRING,
      background_color: Sequelize.STRING,
      calendar_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "calendars", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
    });

    await queryInterface.createTable("goals", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      name: Sequelize.STRING,
      type: Sequelize.STRING,
      goal: Sequelize.INTEGER,
      month: Sequelize.FLOAT,
      week: Sequelize.FLOAT,
      daily: Sequelize.FLOAT,
      actual: Sequelize.INTEGER,
      stats: {
        type: Sequelize.ENUM("DEX", "STR", "INT", "CON", "Nenhum"),
        allowNull: false,
      },
      link: Sequelize.STRING,
      completed: Sequelize.BOOLEAN,
      completedDate: Sequelize.DATEONLY,
      champion_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "champions", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
    });

    await queryInterface.createTable("authentication", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      username: Sequelize.STRING,
      password: Sequelize.STRING,
      lastLogin: Sequelize.DATE,
      champion_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "champions", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
    });

    await queryInterface.createTable("tokens", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      token: Sequelize.STRING,
      used: Sequelize.BOOLEAN,
      champion_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "champions", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
    });

    await queryInterface.createTable("quotes", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      quote: Sequelize.TEXT,
      author: Sequelize.STRING,
      championId: Sequelize.INTEGER,
    });

    await queryInterface.createTable("items", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      store: {
        type: Sequelize.ENUM("tobiasStore", "championsStore"),
        allowNull: false,
      },
      name: Sequelize.STRING,
      category: Sequelize.STRING,
      price: Sequelize.FLOAT,
      description: Sequelize.TEXT,
      image: Sequelize.STRING,
      characteristics: Sequelize.JSONB,
      requirements: Sequelize.JSONB,
    });

    await queryInterface.createTable("achievements", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      name: Sequelize.STRING,
      description: Sequelize.TEXT,
      rewards: Sequelize.JSONB,
      icon: Sequelize.STRING,
      link: Sequelize.STRING,
      goal: Sequelize.INTEGER,
    });

    await queryInterface.createTable("achievementscompleted", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      date: Sequelize.DATEONLY,
      achievement_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "achievements", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      champion_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "champions", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
    });

    await queryInterface.createTable("quests", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      questName: Sequelize.STRING,
      questGoal: Sequelize.FLOAT,
      questActual: Sequelize.INTEGER,
      questLimitDate: Sequelize.DATEONLY,
      questReward: Sequelize.JSONB,
      completed: Sequelize.BOOLEAN,
      completedDate: Sequelize.DATEONLY,
      link: Sequelize.STRING,
      champion_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "champions", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
    });

    await queryInterface.createTable("monthlychallenge", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      questName: Sequelize.STRING,
      questMonth: Sequelize.STRING,
      questGoal: Sequelize.INTEGER,
      questActual: Sequelize.INTEGER,
      questLimitDate: Sequelize.DATEONLY,
      questReward: Sequelize.JSONB,
      completed: Sequelize.BOOLEAN,
      link: Sequelize.STRING,
      champion_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "champions", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
    });

    await queryInterface.createTable("activitiesintensity", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      kmRun: Sequelize.FLOAT,
      jumpRope: Sequelize.FLOAT,
      kmBike: Sequelize.FLOAT,
      upperLimb: Sequelize.FLOAT,
      abs: Sequelize.FLOAT,
      lowerLimb: Sequelize.FLOAT,
      meals: Sequelize.FLOAT,
      drinks: Sequelize.FLOAT,
      sleep: Sequelize.FLOAT,
      study: Sequelize.FLOAT,
      meditation: Sequelize.FLOAT,
      reading: Sequelize.FLOAT,
      champion_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "champions", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
    });

    await queryInterface.createTable("StatsDetails", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      intFromStudy: Sequelize.FLOAT,
      intFromReading: Sequelize.FLOAT,
      intFromMeditation: Sequelize.FLOAT,
      strFromUpper: Sequelize.FLOAT,
      strFromLower: Sequelize.FLOAT,
      strFromAbs: Sequelize.FLOAT,
      dexFromRope: Sequelize.FLOAT,
      dexFromBike: Sequelize.FLOAT,
      dexFromRun: Sequelize.FLOAT,
      conFromMeals: Sequelize.FLOAT,
      conFromDrinks: Sequelize.FLOAT,
      conFromSleep: Sequelize.FLOAT,
      champion_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "champions", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
    });

    await queryInterface.createTable("DailyActivities", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      date: { type: Sequelize.DATEONLY, allowNull: false },
      study: Sequelize.FLOAT,
      reading: Sequelize.FLOAT,
      meditation: Sequelize.FLOAT,
      upperLimb: Sequelize.FLOAT,
      lowerLimb: Sequelize.FLOAT,
      abs: Sequelize.FLOAT,
      jumpRope: Sequelize.FLOAT,
      kmBike: Sequelize.FLOAT,
      kmRun: Sequelize.FLOAT,
      meals: Sequelize.FLOAT,
      drinks: Sequelize.FLOAT,
      sleep: Sequelize.FLOAT,
      champion_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "champions", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
    });
  },

  async down(queryInterface) {
    const tables = [
      "DailyActivities",
      "StatsDetails",
      "activitiesintensity",
      "monthlychallenge",
      "quests",
      "achievementscompleted",
      "achievements",
      "items",
      "quotes",
      "tokens",
      "authentication",
      "goals",
      "events",
      "calendars",
      "files",
      "activities",
      "statistics",
      "champions",
    ];

    for (const table of tables) {
      await queryInterface.dropTable(table);
    }

  },
};
